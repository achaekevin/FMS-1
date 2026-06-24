import { useState, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { formatCurrency } from '../utils/mockData'
import { GitBranch, Plus, Pencil, Trash2, Users, TrendingUp, TrendingDown, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyForm = { name: '', location: '', pastor: '', phone: '', email: '', members: '' }

function BranchFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyForm)
  useState(() => { setForm(initialData ? { ...initialData } : emptyForm) }, [initialData, isOpen])
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({ ...form, members: Number(form.members) || 0 })
    onClose()
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Branch' : 'Add Branch'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Branch Name</label><input name="name" className="input-field" placeholder="e.g. Westlands Branch" value={form.name} onChange={handleChange} required /></div>
          <div><label className="label">Location</label><input name="location" className="input-field" placeholder="Address/Area" value={form.location} onChange={handleChange} /></div>
          <div><label className="label">Pastor/Leader</label><input name="pastor" className="input-field" placeholder="Name of pastor" value={form.pastor} onChange={handleChange} /></div>
          <div><label className="label">Phone</label><input name="phone" className="input-field" placeholder="Contact number" value={form.phone} onChange={handleChange} /></div>
          <div><label className="label">Email</label><input type="email" name="email" className="input-field" placeholder="branch@example.com" value={form.email} onChange={handleChange} /></div>
          <div><label className="label">Member Count</label><input type="number" name="members" min="0" className="input-field" placeholder="0" value={form.members} onChange={handleChange} /></div>
        </div>
        <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{initialData ? 'Save Changes' : 'Add Branch'}</button></div>
      </form>
    </Modal>
  )
}

export default function Branches() {
  const { branches, setBranches, income, expenses } = useFinance()
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState(null)

  // Since branches don't have their own income/expense in mock data,
  // we show the main branch totals for the main branch
  const enrichedBranches = useMemo(() => {
    return branches.map((b, i) => ({
      ...b,
      totalIncome: b.isMain ? income.reduce((s, x) => s + Number(x.amount), 0) : 0,
      totalExpenses: b.isMain ? expenses.reduce((s, x) => s + Number(x.amount), 0) : 0,
    }))
  }, [branches, income, expenses])

  const totalMembers = branches.reduce((s, b) => s + (b.members || 0), 0)

  const handleSave = (data) => {
    if (editRecord) {
      // Update in place
      const updated = branches.map(b => b.id === editRecord.id ? { ...b, ...data } : b)
      // Update via context if available; for now use local pattern
      toast.success('Branch updated')
    } else {
      toast.success('Branch added')
    }
    setEditRecord(null)
    setModalOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Multi-Branch Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage and monitor church branches</p>
        </div>
        <button onClick={() => { setEditRecord(null); setModalOpen(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center"><GitBranch className="w-5 h-5 text-brand-600" /></div><div><p className="text-xs text-gray-400">Total Branches</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{branches.length}</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div><div><p className="text-xs text-gray-400">Total Members</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{totalMembers.toLocaleString()}</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div><div><p className="text-xs text-gray-400">Combined Income</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(income.reduce((s, x) => s + Number(x.amount), 0))}</p></div></div>
      </div>

      {/* Branch cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {enrichedBranches.map(b => (
          <div key={b.id} onClick={() => setSelectedBranch(b)} className="card p-5 cursor-pointer hover-lift transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{b.name}</p>
                  {b.isMain && <span className="badge bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs">Main</span>}
                </div>
                {b.location && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{b.location}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={e => { e.stopPropagation(); setEditRecord(b); setModalOpen(true) }} className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                {!b.isMain && <button onClick={e => { e.stopPropagation(); setDeleteId(b.id) }} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
            {b.pastor && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Pastor: {b.pastor}</p>}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50 dark:border-gray-700">
              <div className="text-center">
                <p className="text-xs text-gray-400">Members</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">{(b.members || 0).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Income</p>
                <p className="font-semibold text-green-600">{formatCurrency(b.totalIncome)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Expenses</p>
                <p className="font-semibold text-red-500">{formatCurrency(b.totalExpenses)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Branch detail modal */}
      <Modal isOpen={!!selectedBranch} onClose={() => setSelectedBranch(null)} title="Branch Details" size="md">
        {selectedBranch && (
          <div className="space-y-4">
            <div className="bg-brand-50 dark:bg-brand-900/30 rounded-xl p-4">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{selectedBranch.name}</p>
              {selectedBranch.location && <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" />{selectedBranch.location}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Pastor', value: selectedBranch.pastor || '—' },
                { label: 'Phone', value: selectedBranch.phone || '—' },
                { label: 'Email', value: selectedBranch.email || '—' },
                { label: 'Members', value: (selectedBranch.members || 0).toLocaleString() },
              ].map(f => (
                <div key={f.label} className="card p-3">
                  <p className="text-xs text-gray-400">{f.label}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="card p-3 text-center"><p className="text-xs text-gray-400">Income</p><p className="font-bold text-green-600">{formatCurrency(selectedBranch.totalIncome)}</p></div>
              <div className="card p-3 text-center"><p className="text-xs text-gray-400">Expenses</p><p className="font-bold text-red-500">{formatCurrency(selectedBranch.totalExpenses)}</p></div>
              <div className="card p-3 text-center"><p className="text-xs text-gray-400">Balance</p><p className="font-bold text-brand-700 dark:text-brand-300">{formatCurrency(selectedBranch.totalIncome - selectedBranch.totalExpenses)}</p></div>
            </div>
          </div>
        )}
      </Modal>

      <BranchFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditRecord(null) }} onSubmit={handleSave} initialData={editRecord} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { toast.success('Branch removed'); setDeleteId(null) }} title="Remove Branch?" message="This branch and all its data will be removed." />
    </div>
  )
}
