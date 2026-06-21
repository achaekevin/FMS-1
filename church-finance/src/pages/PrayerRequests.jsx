import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import api from '../utils/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  Heart, Plus, Pencil, Trash2, Eye, HandHeart, UserCheck,
  Filter, RefreshCw, TrendingUp,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['Healing', 'Family', 'Employment', 'Thanksgiving', 'Other']
const STATUSES   = ['Pending', 'In Progress', 'Answered', 'Closed']
const PRIORITIES = ['High', 'Medium', 'Low']

const categoryColors = {
  Healing:      'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  Family:       'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  Employment:   'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  Thanksgiving: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  Other:        'bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 border-gray-200 dark:border-gray-600',
}
const statusColors = {
  Pending:      'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'In Progress':'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Answered:     'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Closed:       'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}
const priorityBorder = { High: 'border-red-400', Medium: 'border-brand-400', Low: 'border-green-400' }

const categoryIcons = { Healing: '🙏', Family: '👨‍👩‍👧', Employment: '💼', Thanksgiving: '🌟', Other: '❤️' }

const emptyForm = {
  title: '', description: '', category: 'Healing', priority: 'Medium',
  requesterName: '', isAnonymous: false, isPrivate: false,
}

// ── Form Modal ────────────────────────────────────────────────────────────────

function PrayerFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setForm(initialData ? {
      title: initialData.title || '',
      description: initialData.description || '',
      category: initialData.category || 'Healing',
      priority: initialData.priority || 'Medium',
      requesterName: initialData.requesterName || '',
      isAnonymous: initialData.isAnonymous || false,
      isPrivate: initialData.isPrivate || false,
    } : { ...emptyForm, requesterName: user?.name || '' })
  }, [initialData, isOpen, user])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const handleSubmit = e => { e.preventDefault(); onSubmit(form) }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Prayer Request' : 'Submit Prayer Request'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Your Name</label>
          <input name="requesterName" className="input-field" placeholder="Full name..."
            value={form.requesterName} onChange={e => set('requesterName', e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input-field" value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Title</label>
          <input className="input-field" placeholder="Brief title for the request..."
            value={form.title} onChange={e => set('title', e.target.value)} required />
        </div>
        <div>
          <label className="label">Prayer Request</label>
          <textarea rows={4} className="input-field resize-none" placeholder="Share your prayer request..."
            value={form.description} onChange={e => set('description', e.target.value)} required />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" checked={form.isAnonymous}
              onChange={e => set('isAnonymous', e.target.checked)} />
            <span className="text-sm text-gray-600 dark:text-gray-300">Submit anonymously</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded" checked={form.isPrivate}
              onChange={e => set('isPrivate', e.target.checked)} />
            <span className="text-sm text-gray-600 dark:text-gray-300">Keep private (pastor only)</span>
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">
            {initialData ? 'Save Changes' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Assign Modal ──────────────────────────────────────────────────────────────

function AssignModal({ isOpen, onClose, request, onAssign }) {
  const [pastors, setPastors] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    api.get('/users?role=pastor&status=active&limit=50')
      .then(r => setPastors(r.data.data || []))
      .catch(() => setPastors([]))
  }, [isOpen])

  const handleAssign = async () => {
    if (!selectedId) return toast.error('Select a pastor first')
    setLoading(true)
    try {
      await onAssign(request.id, parseInt(selectedId))
      onClose()
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign to Pastor" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Assign <span className="font-medium text-gray-800 dark:text-gray-100">{request?.title}</span> to a pastor for follow-up.
        </p>
        <div>
          <label className="label">Select Pastor</label>
          <select className="input-field" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">-- Choose pastor --</option>
            {pastors.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleAssign} disabled={loading} className="btn-primary">
            {loading ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── View Modal ────────────────────────────────────────────────────────────────

function ViewModal({ isOpen, onClose, request, onPray, canPray }) {
  if (!request) return null
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Prayer Request" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">{categoryIcons[request.category]}</span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">{request.title}</h3>
          <span className={clsx('badge border text-xs', categoryColors[request.category])}>{request.category}</span>
          <span className={clsx('badge text-xs', statusColors[request.status])}>{request.status}</span>
        </div>

        <div className="text-xs text-gray-400 flex flex-wrap gap-3">
          <span>By <span className="font-medium text-gray-600 dark:text-gray-300">{request.isAnonymous ? 'Anonymous' : request.requesterName}</span></span>
          {request.assignee && <span>· Assigned to <span className="font-medium text-gray-600 dark:text-gray-300">{request.assignee.name}</span></span>}
          <span>· {new Date(request.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>
        </div>

        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          {request.description}
        </p>

        {request.pastorNote && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">Pastor's Note</p>
            <p className="text-sm text-purple-800 dark:text-purple-200">{request.pastorNote}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <HandHeart className="w-4 h-4 text-pink-400" />
            <span><strong className="text-gray-700 dark:text-gray-200">{request.prayerCount}</strong> {request.prayerCount === 1 ? 'person' : 'people'} prayed</span>
          </div>
          {canPray && request.status !== 'Closed' && (
            <button onClick={() => onPray(request.id)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
              <HandHeart className="w-3.5 h-3.5" /> I Prayed For This
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ stats }) {
  if (!stats) return null
  const statusMap = Object.fromEntries((stats.byStatus || []).map(s => [s.status, s.count]))
  const items = [
    { label: 'Total',       value: stats.total,                  color: 'text-brand-600' },
    { label: 'Pending',     value: statusMap['Pending'] || 0,     color: 'text-orange-500' },
    { label: 'In Progress', value: statusMap['In Progress'] || 0, color: 'text-blue-500'   },
    { label: 'Answered',    value: statusMap['Answered'] || 0,    color: 'text-green-500'  },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(item => (
        <div key={item.label} className="card p-3 text-center">
          <div className={clsx('text-2xl font-bold', item.color)}>{item.value}</div>
          <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PrayerRequests() {
  const { user, can } = useAuth()

  const isPrivileged = ['administrator', 'pastor'].includes(user?.role)

  // Data
  const [requests, setRequests]   = useState([])
  const [stats, setStats]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [total, setTotal]         = useState(0)

  // Filters
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', page: 1 })
  const [showFilters, setShowFilters] = useState(false)

  // Modals
  const [modalOpen, setModalOpen]   = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [viewRecord, setViewRecord] = useState(null)
  const [assignRecord, setAssignRecord] = useState(null)
  const [deleteId, setDeleteId]     = useState(null)

  // ── Fetch ───────────────────────────────────────────────────────────────────

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: filters.page, limit: 20 }
      if (filters.status)   params.status   = filters.status
      if (filters.category) params.category = filters.category
      if (filters.priority) params.priority = filters.priority

      const res = await api.get('/prayer-requests', { params })
      setRequests(res.data.data || [])
      setTotal(res.data.meta?.total || 0)
    } catch (err) {
      toast.error(err.message || 'Failed to load prayer requests')
    } finally { setLoading(false) }
  }, [filters])

  const fetchStats = useCallback(async () => {
    if (!isPrivileged) return
    try {
      const res = await api.get('/prayer-requests/stats')
      setStats(res.data.data)
    } catch {}
  }, [isPrivileged])

  useEffect(() => { fetchRequests(); fetchStats() }, [fetchRequests, fetchStats])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSave = async (form) => {
    try {
      if (editRecord) {
        await api.put(`/prayer-requests/${editRecord.id}`, form)
        toast.success('Prayer request updated')
      } else {
        await api.post('/prayer-requests', form)
        toast.success('Prayer request submitted')
      }
      setModalOpen(false); setEditRecord(null)
      fetchRequests(); fetchStats()
    } catch (err) { toast.error(err.message) }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/prayer-requests/${deleteId}`)
      toast.success('Prayer request deleted')
      setDeleteId(null)
      fetchRequests(); fetchStats()
    } catch (err) { toast.error(err.message) }
  }

  const handlePray = async (id) => {
    try {
      await api.patch(`/prayer-requests/${id}/pray`)
      toast.success('🙏 Prayer recorded!')
      // Refresh view record and list
      const res = await api.get(`/prayer-requests/${id}`)
      setViewRecord(res.data.data)
      fetchRequests()
    } catch (err) { toast.error(err.message) }
  }

  const handleAssign = async (id, assignedTo) => {
    try {
      await api.patch(`/prayer-requests/${id}/assign`, { assignedTo })
      toast.success('Prayer request assigned')
      fetchRequests()
    } catch (err) { toast.error(err.message) }
  }

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v, page: 1 }))

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-500" /> Prayer Requests
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Submit, track and pray for requests from the congregation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { fetchRequests(); fetchStats() }}
            className="btn-secondary p-2" title="Refresh">
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setShowFilters(f => !f)} className="btn-secondary flex items-center gap-1.5">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button onClick={() => { setEditRecord(null); setModalOpen(true) }} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>
      </div>

      {/* Stats */}
      {isPrivileged && <StatsBar stats={stats} />}

      {/* Filters */}
      {showFilters && (
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={filters.category} onChange={e => setFilter('category', e.target.value)}>
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input-field" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
                <option value="">All Priorities</option>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={() => setFilters({ status: '', category: '', priority: '', page: 1 })} className="btn-secondary text-xs">
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Category quick-filter pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('category', '')}
          className={clsx('px-3 py-1 rounded-full text-xs font-medium border transition-all',
            !filters.category ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-brand-400')}>
          All
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter('category', cat === filters.category ? '' : cat)}
            className={clsx('px-3 py-1 rounded-full text-xs font-medium border transition-all',
              filters.category === cat ? 'bg-brand-600 text-white border-brand-600' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-brand-400')}>
            {categoryIcons[cat]} {cat}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-12 text-center">
          <RefreshCw className="w-8 h-8 text-gray-200 mx-auto mb-3 animate-spin" />
          <p className="text-gray-400">Loading prayer requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card p-12 text-center">
          <Heart className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No prayer requests found</p>
          <p className="text-sm text-gray-300 mt-1">Be the first to submit a prayer request</p>
          <button onClick={() => setModalOpen(true)} className="btn-primary mt-4 inline-flex gap-1.5">
            <Plus className="w-4 h-4" /> Submit Request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const isOwner = r.submittedBy === user?.id
            const canEdit = isOwner || isPrivileged
            const canDelete = isOwner || user?.role === 'administrator'

            return (
              <div key={r.id} className={clsx('card p-4 border-l-4 transition-all hover:shadow-md', priorityBorder[r.priority] || 'border-brand-400')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">

                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{categoryIcons[r.category]}</span>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{r.title}</p>
                      <span className={clsx('badge border text-xs', categoryColors[r.category])}>{r.category}</span>
                      <span className={clsx('badge text-xs', statusColors[r.status])}>{r.status}</span>
                      {r.isPrivate && <span className="badge bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 text-xs">Private</span>}
                      {r.isAnonymous && <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs">Anonymous</span>}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{r.description}</p>

                    {/* Meta */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
                      <span>By <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {r.isAnonymous ? 'Anonymous' : r.requesterName}
                      </span></span>
                      {r.assignee && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-green-400" />
                          {r.assignee.name}
                        </span>
                      )}
                      <span>· {new Date(r.createdAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>
                      <span className="flex items-center gap-1">
                        <HandHeart className="w-3 h-3 text-pink-400" /> {r.prayerCount}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setViewRecord(r)}
                      className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 text-brand-600" title="View">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {isPrivileged && (
                      <button onClick={() => setAssignRecord(r)}
                        className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600" title="Assign">
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={() => { setEditRecord(r); setModalOpen(true) }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => setDeleteId(r.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Showing {((filters.page - 1) * 20) + 1}–{Math.min(filters.page * 20, total)} of {total}</span>
          <div className="flex gap-2">
            <button disabled={filters.page <= 1} onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Prev</button>
            <button disabled={filters.page * 20 >= total} onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
              className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Modals */}
      <PrayerFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditRecord(null) }}
        onSubmit={handleSave} initialData={editRecord} />

      <ViewModal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} request={viewRecord}
        onPray={handlePray} canPray={true} />

      <AssignModal isOpen={!!assignRecord} onClose={() => setAssignRecord(null)}
        request={assignRecord} onAssign={handleAssign} />

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Prayer Request?" message="This prayer request will be permanently removed." />
    </div>
  )
}
