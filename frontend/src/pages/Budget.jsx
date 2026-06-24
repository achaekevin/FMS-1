import { useState, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { formatCurrency } from '../utils/mockData'
import { Plus, Pencil, Trash2, Wallet, TrendingUp, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const CATEGORIES = ['Ministry', 'Operations', 'Salaries', 'Utilities', 'Outreach', 'Welfare', 'Equipment', 'Other']
const PERIODS = ['Monthly', 'Quarterly', 'Annual']

const emptyForm = { name: '', category: 'Ministry', amount: '', period: 'Monthly', description: '', fundName: 'General Fund', year: new Date().getFullYear() }

function BudgetFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyForm)
  const { funds } = useFinance()

  useState(() => { setForm(initialData ? { ...initialData } : emptyForm) }, [initialData, isOpen])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({ ...form, amount: Number(form.amount) })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Budget' : 'Create Budget'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Budget Name</label>
            <input name="name" className="input-field" placeholder="e.g. Ministry Budget 2024" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="input-field" value={form.category} onChange={handleChange}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Period</label>
            <select name="period" className="input-field" value={form.period} onChange={handleChange}>
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Budget Amount (KES)</label>
            <input type="number" name="amount" min="1" className="input-field" placeholder="0.00" value={form.amount} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Year</label>
            <input type="number" name="year" className="input-field" value={form.year} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Fund</label>
            <select name="fundName" className="input-field" value={form.fundName} onChange={handleChange}>
              {funds.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={2} className="input-field resize-none" placeholder="Budget description..." value={form.description} onChange={handleChange} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{initialData ? 'Save Changes' : 'Create Budget'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Budget() {
  const { budgets, addBudget, updateBudget, deleteBudget, expenses } = useFinance()
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  // Compute spent amounts from expenses
  const enriched = useMemo(() => {
    return budgets.map(b => {
      const spent = expenses
        .filter(e => e.category === b.category || e.fund === b.fundName)
        .reduce((s, e) => s + Number(e.amount), 0)
      const remaining = Math.max(0, b.amount - spent)
      const pct = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0
      return { ...b, spent, remaining, pct }
    })
  }, [budgets, expenses])

  const totalBudget = enriched.reduce((s, b) => s + b.amount, 0)
  const totalSpent = enriched.reduce((s, b) => s + b.spent, 0)

  const handleSave = (data) => {
    if (editRecord) {
      updateBudget(editRecord.id, data, user)
      toast.success('Budget updated')
    } else {
      addBudget(data, user)
      toast.success('Budget created')
    }
    setEditRecord(null)
  }

  const handleDelete = () => {
    const b = budgets.find(x => x.id === deleteId)
    deleteBudget(deleteId, b?.name, user)
    toast.success('Budget deleted')
    setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Budget Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create and track church budgets</p>
        </div>
        <button onClick={() => { setEditRecord(null); setModalOpen(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Create Budget
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Budget', value: totalBudget, color: 'blue', icon: Wallet },
          { label: 'Total Spent', value: totalSpent, color: 'orange', icon: TrendingUp },
          { label: 'Remaining', value: totalBudget - totalSpent, color: totalBudget - totalSpent < 0 ? 'red' : 'green', icon: AlertCircle },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${s.color}-50`}>
              <s.icon className={`w-5 h-5 text-${s.color}-600`} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(s.value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Budget cards */}
      {enriched.length === 0 ? (
        <div className="card p-12 text-center">
          <Wallet className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No budgets created yet. Create your first budget to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {enriched.map(b => (
            <div key={b.id} className="card p-5 hover-lift">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{b.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{b.category}</span>
                    <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{b.period}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditRecord(b); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Spent: {formatCurrency(b.spent)}</span>
                  <span>Budget: {formatCurrency(b.amount)}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={clsx('h-2 rounded-full transition-all duration-500', b.pct >= 100 ? 'bg-red-500' : b.pct >= 75 ? 'bg-orange-500' : 'bg-brand-600')}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className={clsx('font-medium', b.pct >= 100 ? 'text-red-500' : 'text-gray-600 dark:text-gray-300')}>
                    {b.pct}% used
                  </span>
                  <span className="text-gray-400">Remaining: {formatCurrency(b.remaining)}</span>
                </div>
              </div>

              {b.description && <p className="text-xs text-gray-400 mt-3 border-t border-gray-50 dark:border-gray-700 pt-2">{b.description}</p>}
            </div>
          ))}
        </div>
      )}

      <BudgetFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditRecord(null) }}
        onSubmit={handleSave}
        initialData={editRecord}
      />
      <ConfirmDialog
        isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Budget?" message="This budget and all its tracking data will be permanently removed."
      />
    </div>
  )
}
