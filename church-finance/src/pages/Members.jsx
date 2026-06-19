import { useState, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import MemberFormModal from '../components/members/MemberFormModal'
import MemberDetailModal from '../components/members/MemberDetailModal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import Pagination from '../components/common/Pagination'
import usePagination from '../hooks/usePagination'
import { formatCurrency, formatDate } from '../utils/mockData'
import { exportMemberReport, exportToExcel, generateMemberStatement } from '../utils/exportUtils'
import { Plus, Search, Pencil, Trash2, FileDown, FileSpreadsheet, Eye, Users, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Members() {
  const { members, income, addMember, updateMember, deleteMember } = useFinance()
  const { user, can } = useAuth()
  const canManage = can('manage_income') || user?.role === 'administrator'

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [detailMember, setDetailMember] = useState(null)
  const [editRecord, setEditRecord] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  // Compute live contribution totals from income records
  const enrichedMembers = useMemo(() => {
    return members.map(m => {
      const contributions = income.filter(i => i.memberName === m.name)
      const total = contributions.reduce((s, c) => s + Number(c.amount), 0)
      return { ...m, liveTotal: total, contributionCount: contributions.length }
    })
  }, [members, income])

  const filtered = useMemo(() => {
    return enrichedMembers.filter(m =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => b.liveTotal - a.liveTotal)
  }, [enrichedMembers, search])

  const { page, setPage, totalPages, paginated, total, perPage } = usePagination(filtered, 8)
  const grandTotal = filtered.reduce((s, m) => s + m.liveTotal, 0)

  const handleSave = (data) => {
    if (editRecord) {
      updateMember(editRecord.id, data, user)
      toast.success('Member updated')
    } else {
      addMember(data, user)
      toast.success('Member added successfully')
    }
    setEditRecord(null)
  }

  const handleDelete = () => {
    const m = members.find(x => x.id === deleteId)
    deleteMember(deleteId, m?.name, user)
    toast.success('Member removed')
    setDeleteId(null)
  }

  const handleExportExcel = () => {
    exportToExcel(filtered.map(m => ({
      Name: m.name, Phone: m.phone, Email: m.email,
      'Total Contributions (KES)': m.liveTotal, 'Join Date': formatDate(m.joinDate),
    })), 'member-contributions')
    toast.success('Excel file downloaded')
  }

  const handleExportPDF = () => {
    exportMemberReport(filtered.map(m => ({ ...m, totalContributions: m.liveTotal })))
    toast.success('PDF report downloaded')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Member Contributions</h1>
          <p className="text-sm text-gray-400 mt-0.5">View and manage member contribution records</p>
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
              <Plus className="w-4 h-4" /> Add Member
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Members</p>
            <p className="text-base font-bold text-gray-900">{members.length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-green-600 font-bold text-xs">KES</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Contributions</p>
            <p className="text-base font-bold text-gray-900">{formatCurrency(grandTotal)}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" className="input-field pl-9"
              placeholder="Search by name, phone, or email..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Member</th>
                <th className="table-header hidden md:table-cell">Phone</th>
                <th className="table-header hidden lg:table-cell">Email</th>
                <th className="table-header text-right">Total Given</th>
                <th className="table-header text-center hidden sm:table-cell">Transactions</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={6} className="table-cell text-center text-gray-400 py-8">No members found</td></tr>
              )}
              {paginated.map(m => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <span className="font-medium text-gray-800">{m.name}</span>
                    </div>
                  </td>
                  <td className="table-cell hidden md:table-cell text-gray-500">{m.phone}</td>
                  <td className="table-cell hidden lg:table-cell text-gray-500">{m.email}</td>
                  <td className="table-cell text-right font-semibold text-gray-800">{formatCurrency(m.liveTotal)}</td>
                  <td className="table-cell text-center hidden sm:table-cell">
                    <span className="badge bg-gray-100 text-gray-600">{m.contributionCount}</span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setDetailMember(m)}
                        className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-600 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const contribs = income.filter(i => i.memberName === m.name)
                          generateMemberStatement(m, contribs)
                          toast.success('Generating statement...')
                        }}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                        title="Download Statement"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => { setEditRecord(m); setModalOpen(true) }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(m.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} perPage={perPage} />
        )}
      </div>

      <MemberFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null) }}
        onSubmit={handleSave}
        initialData={editRecord}
      />
      <MemberDetailModal
        isOpen={!!detailMember}
        onClose={() => setDetailMember(null)}
        member={detailMember}
        contributions={income}
      />
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Member?"
        message="This will deactivate the member record. Their contribution history will be preserved."
      />
    </div>
  )
}
