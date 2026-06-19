import { useState, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import IncomeFormModal from '../components/income/IncomeFormModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Pagination from '../components/common/Pagination'
import usePagination from '../hooks/usePagination'
import { formatCurrency, formatDate, INCOME_CATEGORIES, PAYMENT_METHODS, FUND_NAMES } from '../utils/mockData'
import { exportIncomeReport, exportToExcel, generateReceipt } from '../utils/exportUtils'
import { Plus, Search, Pencil, Trash2, FileDown, FileSpreadsheet, TrendingUp, Receipt } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Income() {
  const { income, addIncome, updateIncome, deleteIncome } = useFinance()
  const { user, can } = useAuth()
  const canManage = can('manage_income') || user?.role === 'administrator'

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [fundFilter, setFundFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const filtered = useMemo(() => {
    return income.filter(i => {
      const matchesSearch = !search ||
        i.memberName.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !categoryFilter || i.category === categoryFilter
      const matchesMethod = !methodFilter || i.paymentMethod === methodFilter
      const matchesFund = !fundFilter || i.fund === fundFilter
      return matchesSearch && matchesCategory && matchesMethod && matchesFund
    }).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [income, search, categoryFilter, methodFilter, fundFilter])

  const { page, setPage, totalPages, paginated, total, perPage } = usePagination(filtered, 8)

  const totalAmount = filtered.reduce((s, i) => s + Number(i.amount), 0)

  const handleSave = (data) => {
    if (editRecord) {
      updateIncome(editRecord.id, data, user)
      toast.success('Income record updated')
    } else {
      addIncome(data, user)
      toast.success('Income recorded successfully')
    }
    setEditRecord(null)
  }

  const handleDelete = () => {
    deleteIncome(deleteId, user)
    toast.success('Income record deleted')
    setDeleteId(null)
  }

  const handleExportExcel = () => {
    exportToExcel(filtered.map(i => ({
      Date: formatDate(i.date), Member: i.memberName, Category: i.category,
      'Amount (KES)': i.amount, 'Payment Method': i.paymentMethod, Fund: i.fund, Description: i.description,
    })), 'income-report')
    toast.success('Excel file downloaded')
  }

  const handleExportPDF = () => {
    exportIncomeReport(filtered)
    toast.success('PDF report downloaded')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Income Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Record and manage tithes, offerings, and donations</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleExportPDF} className="btn-secondary">
            <FileDown className="w-4 h-4" /> <span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={handleExportExcel} className="btn-secondary">
            <FileSpreadsheet className="w-4 h-4" /> <span className="hidden sm:inline">Excel</span>
          </button>
          {canManage && (
            <button onClick={() => { setEditRecord(null); setModalOpen(true) }} className="btn-primary">
              <Plus className="w-4 h-4" /> Record Income
            </button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="card p-4 flex items-center gap-4 bg-gradient-to-r from-green-50 to-white border-green-100">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Total for {total} filtered record{total !== 1 ? 's' : ''}</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" className="input-field pl-9"
              placeholder="Search member or description..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field sm:w-40" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input-field sm:w-40" value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
            <option value="">All Methods</option>
            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input-field sm:w-40" value={fundFilter} onChange={e => setFundFilter(e.target.value)}>
            <option value="">All Funds</option>
            {FUND_NAMES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Member</th>
                <th className="table-header">Category</th>
                <th className="table-header hidden md:table-cell">Method</th>
                <th className="table-header hidden lg:table-cell">Fund</th>
                <th className="table-header text-right">Amount</th>
                {canManage && <th className="table-header text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">No income records found</td></tr>
              )}
              {paginated.map(record => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="table-cell text-xs text-gray-400">{formatDate(record.date)}</td>
                  <td className="table-cell font-medium text-gray-800">{record.memberName}</td>
                  <td className="table-cell">
                    <span className="badge bg-blue-50 text-blue-700">{record.category}</span>
                  </td>
                  <td className="table-cell hidden md:table-cell text-gray-500">{record.paymentMethod}</td>
                  <td className="table-cell hidden lg:table-cell text-gray-500">{record.fund}</td>
                  <td className="table-cell text-right font-semibold text-green-600">{formatCurrency(record.amount)}</td>
                  {canManage && (
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { generateReceipt(record); toast.success('Generating receipt...') }}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                          title="Generate Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setEditRecord(record); setModalOpen(true) }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(record.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} perPage={perPage} />
        )}
      </div>

      <IncomeFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null) }}
        onSubmit={handleSave}
        initialData={editRecord}
      />
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Income Record?"
        message="This action cannot be undone. The record will be permanently removed."
      />
    </div>
  )
}
