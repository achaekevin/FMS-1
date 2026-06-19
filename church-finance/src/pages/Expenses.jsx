import { useState, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import ExpenseFormModal from '../components/expense/ExpenseFormModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Pagination from '../components/common/Pagination'
import usePagination from '../hooks/usePagination'
import { formatCurrency, formatDate, EXPENSE_CATEGORIES, FUND_NAMES } from '../utils/mockData'
import { exportExpenseReport, exportToExcel } from '../utils/exportUtils'
import { Plus, Search, Pencil, Trash2, FileDown, FileSpreadsheet, TrendingDown } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Expenses() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useFinance()
  const { user, can } = useAuth()
  const canManage = can('manage_expense') || user?.role === 'administrator'

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [fundFilter, setFundFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const filtered = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = !search ||
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.approvedBy?.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = !categoryFilter || e.category === categoryFilter
      const matchesFund = !fundFilter || e.fund === fundFilter
      return matchesSearch && matchesCategory && matchesFund
    }).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expenses, search, categoryFilter, fundFilter])

  const { page, setPage, totalPages, paginated, total, perPage } = usePagination(filtered, 8)
  const totalAmount = filtered.reduce((s, e) => s + Number(e.amount), 0)

  const handleSave = (data) => {
    if (editRecord) {
      updateExpense(editRecord.id, data, user)
      toast.success('Expense updated')
    } else {
      addExpense(data, user)
      toast.success('Expense recorded successfully')
    }
    setEditRecord(null)
  }

  const handleDelete = () => {
    deleteExpense(deleteId, user)
    toast.success('Expense deleted')
    setDeleteId(null)
  }

  const handleExportExcel = () => {
    exportToExcel(filtered.map(e => ({
      Date: formatDate(e.date), Category: e.category, 'Amount (KES)': e.amount,
      Fund: e.fund, 'Approved By': e.approvedBy, Description: e.description,
    })), 'expense-report')
    toast.success('Excel file downloaded')
  }

  const handleExportPDF = () => {
    exportExpenseReport(filtered)
    toast.success('PDF report downloaded')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Expense Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track and manage church expenditures</p>
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
              <Plus className="w-4 h-4" /> Record Expense
            </button>
          )}
        </div>
      </div>

      <div className="card p-4 flex items-center gap-4 bg-gradient-to-r from-red-50 to-white border-red-100">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Total for {total} filtered record{total !== 1 ? 's' : ''}</p>
          <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" className="input-field pl-9"
              placeholder="Search description or approver..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field sm:w-44" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input-field sm:w-40" value={fundFilter} onChange={e => setFundFilter(e.target.value)}>
            <option value="">All Funds</option>
            {FUND_NAMES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Category</th>
                <th className="table-header hidden md:table-cell">Description</th>
                <th className="table-header hidden lg:table-cell">Fund</th>
                <th className="table-header">Approved By</th>
                <th className="table-header text-right">Amount</th>
                {canManage && <th className="table-header text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">No expense records found</td></tr>
              )}
              {paginated.map(record => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="table-cell text-xs text-gray-400">{formatDate(record.date)}</td>
                  <td className="table-cell">
                    <span className="badge bg-orange-50 text-orange-700">{record.category}</span>
                  </td>
                  <td className="table-cell hidden md:table-cell text-gray-500 max-w-[200px] truncate">{record.description}</td>
                  <td className="table-cell hidden lg:table-cell text-gray-500">{record.fund}</td>
                  <td className="table-cell text-gray-600">{record.approvedBy}</td>
                  <td className="table-cell text-right font-semibold text-red-500">{formatCurrency(record.amount)}</td>
                  {canManage && (
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-1">
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

      <ExpenseFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null) }}
        onSubmit={handleSave}
        initialData={editRecord}
      />
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Expense Record?"
        message="This action cannot be undone. The record will be permanently removed."
      />
    </div>
  )
}
