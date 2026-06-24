import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  Users, UserPlus, Droplets, Heart, Search, Filter, Plus,
  Pencil, Trash2, Eye, RefreshCw, Loader2, ChevronLeft,
  ChevronRight, CheckCircle2, Clock, Phone, Mail, MapPin,
  Calendar, User, X, TrendingUp,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────
const FOLLOW_UP_OPTIONS = [
  { value: 'pending',      label: 'Pending',      color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30' },
  { value: 'contacted',    label: 'Contacted',    color: 'text-blue-600   bg-blue-50   dark:bg-blue-900/30'   },
  { value: 'visited',      label: 'Visited',      color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
  { value: 'no_response',  label: 'No Response',  color: 'text-red-500    bg-red-50    dark:bg-red-900/30'    },
  { value: 'completed',    label: 'Completed',    color: 'text-green-600  bg-green-50  dark:bg-green-900/30'  },
]

const CONVERSION_OPTIONS = [
  { value: 'not_yet',    label: 'Not Yet',     color: 'text-gray-500  bg-gray-100  dark:bg-gray-700'        },
  { value: 'converted',  label: 'Converted',   color: 'text-green-600 bg-green-50  dark:bg-green-900/30'   },
  { value: 'backslid',   label: 'Backslid',    color: 'text-red-500   bg-red-50    dark:bg-red-900/30'      },
  { value: 'rededicated',label: 'Rededicated', color: 'text-brand-600 bg-brand-50  dark:bg-brand-900/30'   },
]

const MEMBERSHIP_STATUS = [
  { value: 'active',      label: 'Active',      color: 'text-green-600 bg-green-50  dark:bg-green-900/30'   },
  { value: 'inactive',    label: 'Inactive',    color: 'text-gray-500  bg-gray-100  dark:bg-gray-700'       },
  { value: 'transferred', label: 'Transferred', color: 'text-blue-600  bg-blue-50   dark:bg-blue-900/30'    },
  { value: 'deceased',    label: 'Deceased',    color: 'text-red-500   bg-red-50    dark:bg-red-900/30'     },
]

const BAPTISM_TYPES = [
  { value: 'water',       label: 'Water Baptism'       },
  { value: 'holy_spirit', label: 'Holy Spirit Baptism' },
  { value: 'both',        label: 'Both'                },
]

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' }) : '—'

const Badge = ({ value, options }) => {
  const opt = options.find(o => o.value === value)
  if (!opt) return null
  return <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', opt.color)}>{opt.label}</span>
}

// ── Visitor Form Modal ────────────────────────────────────
function VisitorFormModal({ isOpen, onClose, onSuccess, initial }) {
  const empty = {
    fullName:'', phone:'', email:'', address:'', gender:'', dateOfBirth:'',
    visitDate: new Date().toISOString().split('T')[0],
    howHeard:'', notes:'',
    followUpStatus:'pending', followUpDate:'', followUpNotes:'',
    conversionStatus:'not_yet', conversionDate:'', becameMember: false,
  }
  const [form, setForm]   = useState(empty)
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(p => ({...p, [k]:v}))

  useEffect(() => { setForm(initial ? {...empty, ...initial} : empty) }, [initial, isOpen])

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (initial?.id) await api.put(`/visitors/visitors/${initial.id}`, form)
      else             await api.post('/visitors/visitors', form)
      toast.success(initial ? 'Visitor updated' : 'Visitor recorded')
      onSuccess(); onClose()
    } catch(err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Visitor' : 'Record New Visitor'} size="xl">
      <form onSubmit={submit} className="space-y-5">
        {/* Personal Details */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Personal Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Full Name <span className="text-red-400">*</span></label>
              <input className="input-field" placeholder="Full name" value={form.fullName} onChange={e=>set('fullName',e.target.value)} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input-field" placeholder="+254..." value={form.phone} onChange={e=>set('phone',e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" placeholder="email@example.com" value={form.email} onChange={e=>set('email',e.target.value)} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input-field" value={form.gender} onChange={e=>set('gender',e.target.value)}>
                <option value="">— Select —</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input-field" value={form.dateOfBirth} onChange={e=>set('dateOfBirth',e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input className="input-field" placeholder="Home address" value={form.address} onChange={e=>set('address',e.target.value)} />
            </div>
          </div>
        </div>

        {/* Visit Info */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Visit Information</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Visit Date <span className="text-red-400">*</span></label>
              <input type="date" className="input-field" value={form.visitDate} onChange={e=>set('visitDate',e.target.value)} required />
            </div>
            <div>
              <label className="label">How Did They Hear About Us?</label>
              <input className="input-field" placeholder="Friend, social media, etc." value={form.howHeard} onChange={e=>set('howHeard',e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Notes</label>
              <textarea className="input-field resize-none" rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} />
            </div>
          </div>
        </div>

        {/* Follow-up */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Follow-Up</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Follow-Up Status</label>
              <select className="input-field" value={form.followUpStatus} onChange={e=>set('followUpStatus',e.target.value)}>
                {FOLLOW_UP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Follow-Up Date</label>
              <input type="date" className="input-field" value={form.followUpDate} onChange={e=>set('followUpDate',e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Follow-Up Notes</label>
              <textarea className="input-field resize-none" rows={2} value={form.followUpNotes} onChange={e=>set('followUpNotes',e.target.value)} />
            </div>
          </div>
        </div>

        {/* Conversion */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Conversion Status</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Conversion Status</label>
              <select className="input-field" value={form.conversionStatus} onChange={e=>set('conversionStatus',e.target.value)}>
                {CONVERSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Conversion Date</label>
              <input type="date" className="input-field" value={form.conversionDate} onChange={e=>set('conversionDate',e.target.value)} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input type="checkbox" id="becameMember" checked={form.becameMember}
                onChange={e=>set('becameMember',e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <label htmlFor="becameMember" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                This visitor has become a church member
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <UserPlus className="w-4 h-4"/>}
            {initial ? 'Save Changes' : 'Record Visitor'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Baptism Form Modal ────────────────────────────────────
function BaptismFormModal({ isOpen, onClose, onSuccess, initial }) {
  const empty = {
    personName:'', baptismDate: new Date().toISOString().split('T')[0],
    pastor:'', location:'', baptismType:'water',
    certificate:'', witnesses:'', notes:'',
  }
  const [form, setForm]   = useState(empty)
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(p => ({...p, [k]:v}))

  useEffect(() => { setForm(initial ? {...empty,...initial} : empty) }, [initial, isOpen])

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (initial?.id) await api.put(`/visitors/baptisms/${initial.id}`, form)
      else             await api.post('/visitors/baptisms', form)
      toast.success(initial ? 'Record updated' : 'Baptism record created')
      onSuccess(); onClose()
    } catch(err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Baptism Record' : 'New Baptism Record'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Person's Full Name <span className="text-red-400">*</span></label>
            <input className="input-field" placeholder="Full name" value={form.personName} onChange={e=>set('personName',e.target.value)} required />
          </div>
          <div>
            <label className="label">Baptism Date <span className="text-red-400">*</span></label>
            <input type="date" className="input-field" value={form.baptismDate} onChange={e=>set('baptismDate',e.target.value)} required />
          </div>
          <div>
            <label className="label">Baptism Type</label>
            <select className="input-field" value={form.baptismType} onChange={e=>set('baptismType',e.target.value)}>
              {BAPTISM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Officiating Pastor <span className="text-red-400">*</span></label>
            <input className="input-field" placeholder="Pastor name" value={form.pastor} onChange={e=>set('pastor',e.target.value)} required />
          </div>
          <div>
            <label className="label">Location <span className="text-red-400">*</span></label>
            <input className="input-field" placeholder="Church / river / venue" value={form.location} onChange={e=>set('location',e.target.value)} required />
          </div>
          <div>
            <label className="label">Certificate No. (optional)</label>
            <input className="input-field" placeholder="BAPT-2026-001" value={form.certificate} onChange={e=>set('certificate',e.target.value)} />
          </div>
          <div>
            <label className="label">Witnesses (comma-separated)</label>
            <input className="input-field" placeholder="John Doe, Jane Doe" value={form.witnesses} onChange={e=>set('witnesses',e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input-field resize-none" rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Droplets className="w-4 h-4"/>}
            {initial ? 'Save Changes' : 'Save Record'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Visitors Tab ──────────────────────────────────────────
function VisitorsTab({ canManage }) {
  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')
  const [followUp,setFollowUp]= useState('')
  const [conversion,setConversion] = useState('')
  const [formOpen,  setFormOpen]   = useState(false)
  const [editRow,   setEditRow]    = useState(null)
  const [deleteId,  setDeleteId]   = useState(null)
  const [viewRow,   setViewRow]    = useState(null)
  const LIMIT = 15

  const fetch = useCallback(async (p=1) => {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT }
      if (search)     params.search = search
      if (followUp)   params.followUpStatus = followUp
      if (conversion) params.conversionStatus = conversion
      const r = await api.get('/visitors/visitors', { params })
      setRows(r.data.data || []); setTotal(r.data.meta?.total || 0); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [search, followUp, conversion])

  const fetchStats = useCallback(async () => {
    api.get('/visitors/visitors/stats').then(r => setStats(r.data.data)).catch(()=>{})
  }, [])

  useEffect(() => { fetch(1) }, [fetch])
  useEffect(() => { fetchStats() }, [fetchStats])

  const handleDelete = async () => {
    try {
      await api.delete(`/visitors/visitors/${deleteId}`)
      toast.success('Visitor deleted'); setDeleteId(null); fetch(1); fetchStats()
    } catch(e) { toast.error(e.message) }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Visitors',   value: stats.total,          color: 'brand'  },
            { label: 'This Month',       value: stats.newThisMonth,   color: 'blue'   },
            { label: 'Converted',        value: stats.byConversion?.find(c=>c.conversionStatus==='converted')?.count || 0, color: 'green' },
            { label: 'Became Members',   value: stats.becameMembers,  color: 'purple' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <p className={`text-xl font-bold text-${s.color}-600`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + action */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input className="input-field pl-9" placeholder="Search name, phone, email…"
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={followUp} onChange={e=>setFollowUp(e.target.value)}>
          <option value="">All Follow-Up</option>
          {FOLLOW_UP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select className="input-field w-auto" value={conversion} onChange={e=>setConversion(e.target.value)}>
          <option value="">All Conversions</option>
          {CONVERSION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={()=>fetch(1)} className="btn-secondary"><RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')}/></button>
        {canManage && (
          <button onClick={()=>{setEditRow(null);setFormOpen(true)}} className="btn-primary">
            <Plus className="w-4 h-4"/> Add Visitor
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {loading && rows.length === 0 && <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto"/></div>}
          {!loading && rows.length === 0 && (
            <div className="py-14 text-center">
              <Users className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-2"/>
              <p className="text-sm text-gray-400">No visitors found</p>
            </div>
          )}
          {rows.map(v => (
            <div key={v.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 flex-shrink-0">
                {v.fullName.split(' ').map(n=>n[0]).slice(0,2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100">{v.fullName}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{fmt(v.visitDate)}</span>
                  {v.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{v.phone}</span>}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <Badge value={v.followUpStatus}   options={FOLLOW_UP_OPTIONS}   />
                  <Badge value={v.conversionStatus} options={CONVERSION_OPTIONS}  />
                  {v.becameMember && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Member</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={()=>setViewRow(v)} className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 text-gray-400 hover:text-brand-600 transition-colors"><Eye className="w-4 h-4"/></button>
                {canManage && (
                  <>
                    <button onClick={()=>{setEditRow(v);setFormOpen(true)}} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4"/></button>
                    <button onClick={()=>setDeleteId(v.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button disabled={page<=1} onClick={()=>fetch(page-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300"/></button>
              <button disabled={page>=totalPages} onClick={()=>fetch(page+1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300"/></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!viewRow} onClose={()=>setViewRow(null)} title="Visitor Details" size="md">
        {viewRow && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {viewRow.fullName.split(' ').map(n=>n[0]).slice(0,2).join('')}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{viewRow.fullName}</h3>
                <div className="flex gap-2 mt-1">
                  <Badge value={viewRow.followUpStatus}   options={FOLLOW_UP_OPTIONS}  />
                  <Badge value={viewRow.conversionStatus} options={CONVERSION_OPTIONS} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label:'Visit Date',     value: fmt(viewRow.visitDate) },
                { label:'Phone',          value: viewRow.phone || '—' },
                { label:'Email',          value: viewRow.email || '—' },
                { label:'Gender',         value: viewRow.gender || '—' },
                { label:'How Heard',      value: viewRow.howHeard || '—' },
                { label:'Follow-Up Date', value: fmt(viewRow.followUpDate) },
                { label:'Counselor',      value: viewRow.counselor?.name || '—' },
                { label:'Became Member',  value: viewRow.becameMember ? 'Yes' : 'No' },
              ].map(f => (
                <div key={f.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-400">{f.label}</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100 text-sm mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>
            {viewRow.notes && <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-sm text-gray-700 dark:text-gray-300">{viewRow.notes}</p></div>}
            {viewRow.followUpNotes && <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><p className="text-xs text-blue-400 mb-1">Follow-Up Notes</p><p className="text-sm text-blue-700 dark:text-blue-300">{viewRow.followUpNotes}</p></div>}
          </div>
        )}
      </Modal>

      <VisitorFormModal isOpen={formOpen} onClose={()=>{setFormOpen(false);setEditRow(null)}}
        onSuccess={()=>{fetch(1);fetchStats()}} initial={editRow} />
      <ConfirmDialog isOpen={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Visitor?" message="This visitor record will be permanently removed." />
    </div>
  )
}

// ── Baptisms Tab ──────────────────────────────────────────
function BaptismsTab({ canManage }) {
  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editRow,  setEditRow]  = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const LIMIT = 15

  const fetch = useCallback(async (p=1) => {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT }
      if (search) params.search = search
      const r = await api.get('/visitors/baptisms', { params })
      setRows(r.data.data || []); setTotal(r.data.meta?.total || 0); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [search])

  useEffect(() => { fetch(1) }, [fetch])

  const handleDelete = async () => {
    try {
      await api.delete(`/visitors/baptisms/${deleteId}`)
      toast.success('Record deleted'); setDeleteId(null); fetch(1)
    } catch(e) { toast.error(e.message) }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input className="input-field pl-9" placeholder="Search name, pastor, location…"
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <button onClick={()=>fetch(1)} className="btn-secondary"><RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')}/></button>
        {canManage && (
          <button onClick={()=>{setEditRow(null);setFormOpen(true)}} className="btn-primary">
            <Plus className="w-4 h-4"/> Add Record
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {loading && rows.length === 0 && <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto"/></div>}
          {!loading && rows.length === 0 && (
            <div className="py-14 text-center">
              <Droplets className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-2"/>
              <p className="text-sm text-gray-400">No baptism records found</p>
            </div>
          )}
          {rows.map(b => (
            <div key={b.id} className="px-5 py-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Droplets className="w-5 h-5 text-blue-600"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100">{b.personName}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/>{fmt(b.baptismDate)}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3"/>Pastor {b.pastor}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/>{b.location}</span>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {BAPTISM_TYPES.find(t=>t.value===b.baptismType)?.label || b.baptismType}
                  </span>
                  {b.certificate && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Cert: {b.certificate}</span>}
                </div>
              </div>
              {canManage && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={()=>{setEditRow(b);setFormOpen(true)}} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 transition-colors"><Pencil className="w-4 h-4"/></button>
                  <button onClick={()=>setDeleteId(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                </div>
              )}
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button disabled={page<=1} onClick={()=>fetch(page-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300"/></button>
              <button disabled={page>=totalPages} onClick={()=>fetch(page+1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300"/></button>
            </div>
          </div>
        )}
      </div>

      <BaptismFormModal isOpen={formOpen} onClose={()=>{setFormOpen(false);setEditRow(null)}}
        onSuccess={()=>fetch(1)} initial={editRow} />
      <ConfirmDialog isOpen={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Record?" message="This baptism record will be permanently removed." />
    </div>
  )
}

// ── Membership Status Tab ─────────────────────────────────
function MembershipTab({ canManage }) {
  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState('')
  const LIMIT = 20

  const fetch = useCallback(async (p=1) => {
    setLoading(true)
    try {
      const params = { page:p, limit:LIMIT }
      if (search) params.search = search
      if (status) params.status = status
      const r = await api.get('/members', { params })
      setRows(r.data.data?.rows || r.data.data || [])
      setTotal(r.data.meta?.total || 0); setPage(p)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [search, status])

  useEffect(() => { fetch(1) }, [fetch])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input className="input-field pl-9" placeholder="Search members…"
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {MEMBERSHIP_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={()=>fetch(1)} className="btn-secondary"><RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')}/></button>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        {MEMBERSHIP_STATUS.map(s => (
          <button key={s.value} onClick={()=>setStatus(status===s.value?'':s.value)}
            className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
              status===s.value ? s.color+' border-current' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-600 hover:border-gray-300'
            )}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {loading && rows.length === 0 && <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto"/></div>}
          {!loading && rows.length === 0 && (
            <div className="py-14 text-center">
              <Heart className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-2"/>
              <p className="text-sm text-gray-400">No members found</p>
            </div>
          )}
          {rows.map(m => (
            <div key={m.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
              <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 flex-shrink-0">
                {(m.fullName||'?').split(' ').map(n=>n[0]).slice(0,2).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{m.fullName}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  {m.phone && <span>{m.phone}</span>}
                  {m.joinDate && <span>Joined {fmt(m.joinDate)}</span>}
                </div>
              </div>
              <Badge value={m.status} options={MEMBERSHIP_STATUS} />
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
            <p className="text-xs text-gray-400">Page {page} of {totalPages} · {total} members</p>
            <div className="flex gap-1">
              <button disabled={page<=1} onClick={()=>fetch(page-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300"/></button>
              <button disabled={page>=totalPages} onClick={()=>fetch(page+1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300"/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function Visitors() {
  const { user } = useAuth()
  const canManage = ['administrator','treasurer'].includes(user?.role)
  const [tab, setTab] = useState('visitors')

  const TABS = [
    { id:'visitors',   label:'Visitors',          icon: Users    },
    { id:'baptisms',   label:'Baptism Records',   icon: Droplets },
    { id:'membership', label:'Membership Status', icon: Heart    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Visitor Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Track visitors, follow-ups, baptisms, and membership status
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={clsx('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                tab===t.id
                  ? 'bg-white dark:bg-gray-700 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}>
              <Icon className="w-4 h-4"/>{t.label}
            </button>
          )
        })}
      </div>

      {tab === 'visitors'   && <VisitorsTab   canManage={canManage} />}
      {tab === 'baptisms'   && <BaptismsTab   canManage={canManage} />}
      {tab === 'membership' && <MembershipTab canManage={canManage} />}
    </div>
  )
}
