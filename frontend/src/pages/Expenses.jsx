import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import api from '../utils/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  Plus, Search, Pencil, Trash2, TrendingDown, RefreshCw,
  CheckCircle2, XCircle, Clock, ShieldCheck, AlertTriangle,
  ChevronDown, FileDown, Eye, Loader2, Info,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['Salaries','Utilities','Maintenance','Ministry','Welfare','Missions','Equipment','Stationery','Transport','Other']
const STATUSES   = ['pending_pastor','pending_admin','approved','rejected']

const STATUS_META = {
  pending_pastor: { label: 'Awaiting Pastor',  icon: Clock,        color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', dot: 'bg-yellow-400' },
  pending_admin:  { label: 'Awaiting Admin',   icon: ShieldCheck,  color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',         dot: 'bg-blue-400'   },
  approved:       { label: 'Approved',          icon: CheckCircle2, color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',      dot: 'bg-green-400'  },
  rejected:       { label: 'Rejected',          icon: XCircle,      color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',             dot: 'bg-red-400'    },
}

const fmt = (v) => 'KES ' + Number(v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending_pastor
  const Icon = m.icon
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', m.color)}>
      <Icon className="w-3 h-3" />{m.label}
    </span>
  )
}

// ── Expense Form Modal ─────────────────────────────────────────────────────────

const emptyForm = { category: 'Ministry', amount: '', date: new Date().toISOString().slice(0,10), description: '', fundId: '' }

function ExpenseFormModal({ isOpen, onClose, onSubmit, initialData, threshold, funds }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(initialData
      ? { category: initialData.category, amount: initialData.amount, date: initialData.date?.slice(0,10) || '', description: initialData.description || '', fundId: initialData.fundId || '' }
      : emptyForm)
  }, [initialData, isOpen])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const amount = parseFloat(form.amount) || 0
  const needsDualAuth = amount >= threshold

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Expense' : 'Record Expense'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Dual-auth warning */}
        {needsDualAuth && (
          <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              <span className="font-semibold">Dual-authorization required.</span> This expense exceeds the KES {fmt(threshold)} threshold and will need approval from both the Pastor and Administrator before funds are disbursed.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input-field" value={form.date} onChange={e => set('date', e.target.value)} required />
          </div>
        </div>

        <div>
          <label className="label">Amount (KES)</label>
          <input type="number" min="1" step="0.01" className="input-field" placeholder="0.00"
            value={form.amount} onChange={e => set('amount', e.target.value)} required />
          {threshold > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Dual-auth threshold: {fmt(threshold)}
              {needsDualAuth ? ' — will require approval' : ' — will auto-approve'}
            </p>
          )}
        </div>

        <div>
          <label className="label">Fund Account</label>
          <select className="input-field" value={form.fundId} onChange={e => set('fundId', e.target.value)}>
            <option value="">No specific fund</option>
            {funds.map(f => <option key={f.id} value={f.id}>{f.fundName}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea rows={3} className="input-field resize-none" placeholder="What is this expense for?"
            value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : initialData ? 'Save Changes' : 'Submit Expense'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Approval Action Modal (approve / reject / finalize) ───────────────────────

function ActionModal({ isOpen, onClose, onSubmit, action, expense }) {
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (isOpen) setNote('') }, [isOpen])

  const isReject = action === 'reject'
  const titles   = { approve: 'Approve Expense', finalize: 'Finalize & Disburse', reject: 'Reject Expense' }
  const colors   = { approve: 'btn-primary', finalize: 'bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm', reject: 'bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 text-sm' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isReject && !note.trim()) { toast.error('Please provide a rejection reason'); return }
    setSaving(true)
    try { await onSubmit(note); onClose() }
    finally { setSaving(false) }
  }

  if (!expense) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titles[action] || 'Action'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Expense summary */}
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Category</span>
            <span className="font-medium text-gray-800 dark:text-gray-100">{expense.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-red-500">{fmt(expense.amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Submitted by</span>
            <span className="font-medium text-gray-800 dark:text-gray-100">{expense.recorder?.name || '—'}</span>
          </div>
        </div>

        {action === 'finalize' && (
          <div className="flex gap-2.5 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
            <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-700 dark:text-green-300">
              <span className="font-semibold">This action is irreversible.</span> Finalizing will mark the expense as approved and debit the fund immediately.
            </p>
          </div>
        )}

        <div>
          <label className="label">{isReject ? 'Rejection Reason *' : 'Note (optional)'}</label>
          <textarea rows={3} className="input-field resize-none"
            placeholder={isReject ? 'Explain why this expense is being rejected...' : 'Add a comment or note...'}
            value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className={clsx(colors[action], 'disabled:opacity-60')}>
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</>
              : action === 'approve' ? <><CheckCircle2 className="w-4 h-4" /> Approve</>
              : action === 'finalize' ? <><ShieldCheck className="w-4 h-4" /> Finalize & Disburse</>
              : <><XCircle className="w-4 h-4" /> Reject</>}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ isOpen, onClose, expense }) {
  if (!expense) return null
  const steps = [
    { label: 'Submitted',    done: true,                                     who: expense.recorder?.name,   at: expense.createdAt,           note: null                 },
    { label: 'Pastor Review',done: ['pending_admin','approved','rejected'].includes(expense.status), who: expense.pastor?.name, at: expense.pastorApprovedAt, note: expense.pastorNote },
    { label: 'Admin Final',  done: ['approved'].includes(expense.status),    who: expense.admin?.name,      at: expense.adminFinalizedAt,    note: expense.adminNote    },
  ]
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expense Details" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Category',    expense.category],
            ['Amount',      fmt(expense.amount)],
            ['Date',        expense.date],
            ['Fund',        expense.fund?.fundName || '—'],
            ['Status',      null],
            ['Description', expense.description || '—'],
          ].map(([k, v]) => (
            <div key={k} className={k === 'Description' ? 'col-span-2' : ''}>
              <p className="text-xs text-gray-400">{k}</p>
              {k === 'Status'
                ? <StatusBadge status={expense.status} />
                : <p className={clsx('font-medium', k === 'Amount' && 'text-red-500')}>{v}</p>}
            </div>
          ))}
        </div>

        {/* Approval timeline */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Approval Timeline</p>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={step.label} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    step.done ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700')}>
                    {step.done
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      : <Clock className="w-3.5 h-3.5 text-gray-400" />}
                  </div>
                  {i < steps.length - 1 && <div className={clsx('w-0.5 flex-1 mt-1', step.done ? 'bg-green-200 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-700')} />}
                </div>
                <div className="pb-3 flex-1">
                  <p className={clsx('text-sm font-semibold', step.done ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400')}>{step.label}</p>
                  {step.done && step.who && <p className="text-xs text-gray-500">{step.who}{step.at ? ` · ${new Date(step.at).toLocaleDateString('en-KE')}` : ''}</p>}
                  {step.note && <p className="text-xs text-gray-400 italic mt-0.5">"{step.note}"</p>}
                  {!step.done && <p className="text-xs text-gray-400">Pending</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function Expenses() {
  const { user, can } = useAuth()
  const role = user?.role

  const canCreate  = can('manage_expense') || role === 'administrator'
  const canApprove = role === 'pastor' || role === 'administrator'
  const canFinalize = role === 'administrator'

  // Data
  const [records,   setRecords]   = useState([])
  const [funds,     setFunds]     = useState([])
  const [summary,   setSummary]   = useState(null)
  const [threshold, setThreshold] = useState(5000)
  const [loading,   setLoading]   = useState(false)
  const [total,     setTotal]     = useState(0)

  // Filters
  const [search,      setSearch]      = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [catFilter,   setCatFilter]   = useState('')
  const [page,        setPage]        = useState(1)

  // Modals
  const [formOpen,   setFormOpen]   = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [viewRecord, setViewRecord] = useState(null)
  const [actionModal, setActionModal] = useState({ open: false, action: null, expense: null })
  const [deleteId,   setDeleteId]   = useState(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 12 }
      if (statusFilter) params.status   = statusFilter
      if (catFilter)    params.category = catFilter
      const [expRes, fundRes, thrRes] = await Promise.all([
        api.get('/expenses', { params }),
        api.get('/funds'),
        api.get('/expenses/threshold'),
      ])
      const data = expRes.data.data
      setRecords(data.records || [])
      setSummary(data.summary || null)
      setTotal(expRes.data.meta?.total || 0)
      setFunds(fundRes.data.data || [])
      setThreshold(thrRes.data.data?.threshold || 5000)
    } catch (err) { toast.error(err.message || 'Failed to load expenses') }
    finally { setLoading(false) }
  }, [page, statusFilter, catFilter])

  useEffect(() => { load() }, [load])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSave = async (form) => {
    try {
      if (editRecord) {
        await api.put(`/expenses/${editRecord.id}`, form)
        toast.success('Expense updated')
      } else {
        const res = await api.post('/expenses', form)
        const msg = res.data.message || 'Expense submitted'
        toast.success(msg)
      }
      load()
    } catch (err) { toast.error(err.message); throw err }
  }

  const openAction = (action, expense) => setActionModal({ open: true, action, expense })
  const closeAction = () => setActionModal({ open: false, action: null, expense: null })

  const handleAction = async (note) => {
    const { action, expense } = actionModal
    try {
      if (action === 'approve')  await api.patch(`/expenses/${expense.id}/approve`,  { note })
      if (action === 'finalize') await api.patch(`/expenses/${expense.id}/finalize`, { note })
      if (action === 'reject')   await api.patch(`/expenses/${expense.id}/reject`,   { note })
      toast.success(`Expense ${action === 'finalize' ? 'finalized' : action + 'd'} successfully`)
      load()
    } catch (err) { toast.error(err.message); throw err }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/expenses/${deleteId}`)
      toast.success('Expense deleted')
      setDeleteId(null); load()
    } catch (err) { toast.error(err.message) }
  }

  // Pending counts for the current user
  const pendingPastor = records.filter(r => r.status === 'pending_pastor').length
  const pendingAdmin  = records.filter(r => r.status === 'pending_admin').length

  const filtered = records.filter(r =>
    !search || r.category?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase()) ||
    r.recorder?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Expense Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Dual-auth threshold: <span className="font-semibold text-amber-600 dark:text-amber-400">{fmt(threshold)}</span>
            <span className="text-gray-400"> — expenses above this require Pastor + Admin approval</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary p-2" title="Refresh">
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>
          {canCreate && (
            <button onClick={() => { setEditRecord(null); setFormOpen(true) }} className="btn-primary">
              <Plus className="w-4 h-4" /> Record Expense
            </button>
          )}
        </div>
      </div>

      {/* ── Pending action alerts ── */}
      {canApprove && pendingPastor > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              {pendingPastor} expense{pendingPastor > 1 ? 's' : ''} awaiting your review
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">Review and approve or reject each one below.</p>
          </div>
          <button onClick={() => setStatusFilter('pending_pastor')} className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 hover:underline">
            Filter
          </button>
        </div>
      )}
      {canFinalize && pendingAdmin > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              {pendingAdmin} expense{pendingAdmin > 1 ? 's' : ''} awaiting final authorization
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Pastor has approved. Your finalization will disburse the funds.</p>
          </div>
          <button onClick={() => setStatusFilter('pending_admin')} className="text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline">
            Filter
          </button>
        </div>
      )}

      {/* ── Summary cards ── */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Records',      value: total,                         color: 'text-gray-700 dark:text-gray-100' },
            { label: 'Pending Pastor',     value: records.filter(r => r.status === 'pending_pastor').length, color: 'text-yellow-600' },
            { label: 'Pending Admin',      value: records.filter(r => r.status === 'pending_admin').length,  color: 'text-blue-600'   },
            { label: 'Approved Total',     value: fmt(records.filter(r => r.status === 'approved').reduce((s, r) => s + parseFloat(r.amount || 0), 0)), color: 'text-red-500' },
          ].map(c => (
            <div key={c.label} className="card p-3.5">
              <p className="text-xs text-gray-400">{c.label}</p>
              <p className={clsx('text-xl font-bold mt-0.5 truncate', c.color)}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field sm:w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>)}
        </select>
        <select className="input-field sm:w-44" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        {(statusFilter || catFilter) && (
          <button onClick={() => { setStatusFilter(''); setCatFilter('') }} className="text-xs text-brand-600 hover:underline self-center">
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        )}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Category</th>
                  <th className="table-header hidden md:table-cell">Description</th>
                  <th className="table-header hidden lg:table-cell">Submitted By</th>
                  <th className="table-header text-right">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-10">No expense records found</td></tr>
                )}
                {filtered.map(record => {
                  const amount    = parseFloat(record.amount || 0)
                  const isDual    = amount >= threshold
                  const canEdit   = canCreate && record.status === 'pending_pastor'
                  const canDel    = canCreate && ['pending_pastor', 'rejected'].includes(record.status)
                  const showApprove  = canApprove && record.status === 'pending_pastor'
                  const showFinalize = canFinalize && record.status === 'pending_admin'
                  const showReject   = canApprove && ['pending_pastor', 'pending_admin'].includes(record.status)

                  return (
                    <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="table-cell text-xs text-gray-400 whitespace-nowrap">
                        {record.date}
                        {isDual && <span className="ml-1 text-amber-500" title="Dual-auth required">⚡</span>}
                      </td>
                      <td className="table-cell">
                        <span className="badge bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">{record.category}</span>
                      </td>
                      <td className="table-cell hidden md:table-cell text-gray-500 max-w-[180px] truncate">{record.description || '—'}</td>
                      <td className="table-cell hidden lg:table-cell text-gray-500">{record.recorder?.name || '—'}</td>
                      <td className="table-cell text-right font-bold text-red-500">{fmt(record.amount)}</td>
                      <td className="table-cell"><StatusBadge status={record.status} /></td>
                      <td className="table-cell">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <button onClick={() => setViewRecord(record)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {showApprove && (
                            <button onClick={() => openAction('approve', record)}
                              className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600" title="Approve">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {showFinalize && (
                            <button onClick={() => openAction('finalize', record)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600" title="Finalize & Disburse">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {showReject && (
                            <button onClick={() => openAction('reject', record)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Reject">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button onClick={() => { setEditRecord(record); setFormOpen(true) }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500" title="Edit">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDel && (
                            <button onClick={() => setDeleteId(record.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 12 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {((page-1)*12)+1}–{Math.min(page*12, total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p-1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
              <button disabled={page*12 >= total} onClick={() => setPage(p => p+1)} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ExpenseFormModal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditRecord(null) }}
        onSubmit={handleSave} initialData={editRecord} threshold={threshold} funds={funds} />

      <DetailModal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} expense={viewRecord} />

      <ActionModal isOpen={actionModal.open} onClose={closeAction}
        onSubmit={handleAction} action={actionModal.action} expense={actionModal.expense} />

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Expense?" message="Only pending or rejected expenses can be deleted. This cannot be undone." />
    </div>
  )
}
