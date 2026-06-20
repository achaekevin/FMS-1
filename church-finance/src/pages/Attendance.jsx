import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  Users, Plus, QrCode, UserCheck, Download, RefreshCw, ChevronLeft,
  ChevronRight, Search, Filter, X, Loader2, CheckCircle2, Clock,
  Calendar, MapPin, Pencil, Trash2, Eye, BarChart2, TrendingUp,
  UserPlus, Lock, Unlock, History, AlertCircle, Sun, Moon,
  BookOpen, Mic2, Star,
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────
const SERVICE_TYPES = [
  'Sunday Service','Midweek Service','Cell Group','Conference','Special Event','Other'
]
const TYPE_CONFIG = {
  'Sunday Service':  { icon: Sun,      color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
  'Midweek Service': { icon: BookOpen, color: 'text-blue-600',   bg: 'bg-blue-50   dark:bg-blue-900/30'   },
  'Cell Group':      { icon: Users,    color: 'text-green-600',  bg: 'bg-green-50  dark:bg-green-900/30'  },
  'Conference':      { icon: Mic2,     color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  'Special Event':   { icon: Star,     color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  'Other':           { icon: Calendar, color: 'text-gray-500',   bg: 'bg-gray-100  dark:bg-gray-700'      },
}
const fmt = (d) => new Date(d).toLocaleDateString('en-KE',{ day:'numeric',month:'short',year:'numeric' })

// ─── Session Form Modal ───────────────────────────────────
function SessionFormModal({ isOpen, onClose, onSuccess, initial }) {
  const empty = { title:'', serviceType:'Sunday Service', sessionDate:'',
    startTime:'', endTime:'', location:'', description:'', expectedCount:'',
    qrDurationMinutes:'120', notes:'' }
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setForm(initial ? { ...empty, ...initial } : empty) }, [initial, isOpen])
  const set = (k,v) => setForm(p => ({...p,[k]:v}))

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const body = { ...form,
        expectedCount: form.expectedCount ? Number(form.expectedCount) : 0,
        qrDurationMinutes: form.qrDurationMinutes ? Number(form.qrDurationMinutes) : undefined,
      }
      if (initial?.id) await api.put(`/attendance/sessions/${initial.id}`, body)
      else             await api.post('/attendance/sessions', body)
      toast.success(initial ? 'Session updated' : 'Session created')
      onSuccess(); onClose()
    } catch(err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Session' : 'New Session'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Title <span className="text-red-400">*</span></label>
            <input className="input-field" placeholder="e.g. Sunday Morning Service"
              value={form.title} onChange={e=>set('title',e.target.value)} required />
          </div>
          <div>
            <label className="label">Service Type <span className="text-red-400">*</span></label>
            <select className="input-field" value={form.serviceType} onChange={e=>set('serviceType',e.target.value)}>
              {SERVICE_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date <span className="text-red-400">*</span></label>
            <input type="date" className="input-field" value={form.sessionDate} onChange={e=>set('sessionDate',e.target.value)} required />
          </div>
          <div>
            <label className="label">Start Time</label>
            <input type="time" className="input-field" value={form.startTime} onChange={e=>set('startTime',e.target.value)} />
          </div>
          <div>
            <label className="label">End Time</label>
            <input type="time" className="input-field" value={form.endTime} onChange={e=>set('endTime',e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Location</label>
            <input className="input-field" placeholder="e.g. Main Sanctuary"
              value={form.location} onChange={e=>set('location',e.target.value)} />
          </div>
          <div>
            <label className="label">Expected Attendance</label>
            <input type="number" min="0" className="input-field" placeholder="0"
              value={form.expectedCount} onChange={e=>set('expectedCount',e.target.value)} />
          </div>
          <div>
            <label className="label">QR Code Valid For (minutes)</label>
            <input type="number" min="1" className="input-field" placeholder="120"
              value={form.qrDurationMinutes} onChange={e=>set('qrDurationMinutes',e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input-field resize-none" rows={2}
              value={form.description} onChange={e=>set('description',e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>}
            {initial ? 'Save Changes' : 'Create Session'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── QR Code Modal ────────────────────────────────────────
function QrModal({ session, onClose }) {
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return
    setLoading(true)
    api.get(`/attendance/sessions/${session.id}/qrcode`)
      .then(r => setQrData(r.data.data))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [session])

  const downloadQr = () => {
    if (!qrData?.qrCode) return
    const a = document.createElement('a')
    a.href = qrData.qrCode
    a.download = `attendance-qr-${session.id}.png`
    a.click()
  }

  if (!session) return null
  return (
    <Modal isOpen={!!session} onClose={onClose} title="QR Code Check-In" size="sm">
      <div className="text-center space-y-4">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{session.title}</p>
        <p className="text-xs text-gray-400">{fmt(session.sessionDate)} · {session.serviceType}</p>

        {loading && <div className="py-8"><Loader2 className="w-8 h-8 animate-spin text-brand-400 mx-auto"/></div>}

        {qrData && (
          <>
            <div className="flex justify-center">
              <img src={qrData.qrCode} alt="QR Code" className="w-56 h-56 rounded-xl border border-gray-100 dark:border-gray-700 shadow" />
            </div>

            {qrData.expiresAt && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600">
                <Clock className="w-3.5 h-3.5"/>
                Expires: {new Date(qrData.expiresAt).toLocaleString('en-KE',{timeStyle:'short',dateStyle:'short'})}
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">Check-In URL</p>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">{qrData.checkInUrl}</p>
            </div>

            <div className="flex gap-2 justify-center">
              <button onClick={downloadQr} className="btn-primary text-sm">
                <Download className="w-4 h-4"/> Download QR
              </button>
              <button onClick={() => { navigator.clipboard.writeText(qrData.checkInUrl); toast.success('URL copied!') }}
                className="btn-secondary text-sm">Copy URL</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

// ─── Manual Check-In Modal ────────────────────────────────
function CheckInModal({ session, onClose, onSuccess }) {
  const [mode, setMode]       = useState('member') // 'member' | 'guest'
  const [members, setMembers] = useState([])
  const [search,  setSearch]  = useState('')
  const [selected, setSelected] = useState(null)
  const [guest, setGuest]     = useState({ name:'', phone:'' })
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!session) return
    setFetching(true)
    api.get('/members', { params: { limit: 200, status: 'active' } })
      .then(r => setMembers(r.data.data?.rows || r.data.data || []))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [session])

  const filtered = members.filter(m =>
    !search ||
    m.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search)
  )

  const submit = async () => {
    if (mode === 'member' && !selected) { toast.error('Select a member'); return }
    if (mode === 'guest' && !guest.name.trim()) { toast.error('Enter guest name'); return }
    setLoading(true)
    try {
      const body = mode === 'member'
        ? { memberId: selected.id, notes }
        : { guestName: guest.name.trim(), guestPhone: guest.phone || undefined, notes }
      await api.post(`/attendance/sessions/${session.id}/checkin`, body)
      toast.success(mode === 'member' ? `${selected.fullName} checked in` : `${guest.name} checked in`)
      onSuccess()
      setSelected(null); setGuest({ name:'', phone:'' }); setNotes(''); setSearch('')
    } catch(err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  if (!session) return null
  return (
    <Modal isOpen={!!session} onClose={onClose} title="Manual Check-In" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Session: <span className="font-semibold text-gray-800 dark:text-gray-100">{session.title}</span>
        </p>

        {/* Mode toggle */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {[['member','Member'],['guest','Guest / Walk-in']].map(([val, label]) => (
            <button key={val} onClick={() => { setMode(val); setSelected(null) }}
              className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                mode === val
                  ? 'bg-white dark:bg-gray-700 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              )}>
              {label}
            </button>
          ))}
        </div>

        {mode === 'member' ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input className="input-field pl-9" placeholder="Search member by name or phone..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
              {fetching && <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin text-brand-400 mx-auto"/></div>}
              {!fetching && filtered.length === 0 && (
                <p className="text-sm text-gray-400 text-center p-4">No members found</p>
              )}
              {filtered.map(m => (
                <button key={m.id} type="button"
                  onClick={() => setSelected(selected?.id === m.id ? null : m)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    selected?.id === m.id
                      ? 'bg-brand-50 dark:bg-brand-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  )}>
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 flex-shrink-0">
                    {m.fullName?.split(' ').map(n=>n[0]).slice(0,2).join('') || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{m.fullName}</p>
                    <p className="text-xs text-gray-400">{m.phone || '—'}</p>
                  </div>
                  {selected?.id === m.id && <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0"/>}
                </button>
              ))}
            </div>
            {selected && (
              <p className="text-xs text-brand-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5"/> Selected: {selected.fullName}
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Full Name <span className="text-red-400">*</span></label>
              <input className="input-field" placeholder="Guest full name"
                value={guest.name} onChange={e => setGuest(p=>({...p,name:e.target.value}))} />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input className="input-field" placeholder="+254..."
                value={guest.phone} onChange={e => setGuest(p=>({...p,phone:e.target.value}))} />
            </div>
          </div>
        )}

        <div>
          <label className="label">Notes (optional)</label>
          <input className="input-field" placeholder="Any notes..."
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <UserCheck className="w-4 h-4"/>}
            Check In
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Session Detail Modal ─────────────────────────────────
function SessionDetailModal({ sessionId, onClose }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')
  const [delId,   setDelId]   = useState(null)

  const load = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const r = await api.get(`/attendance/sessions/${sessionId}`)
      setData(r.data.data)
    } catch(e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [sessionId])

  useEffect(() => { load() }, [load])

  const removeRecord = async () => {
    try {
      await api.delete(`/attendance/records/${delId}`)
      toast.success('Record removed'); setDelId(null); load()
    } catch(e) { toast.error(e.message) }
  }

  const records = data?.records || []
  const filtered = records.filter(r => {
    const name = r.member?.fullName || r.guestName || ''
    return !search || name.toLowerCase().includes(search.toLowerCase())
  })

  if (!sessionId) return null
  const cfg = TYPE_CONFIG[data?.serviceType] || TYPE_CONFIG['Other']
  const Icon = cfg.icon

  return (
    <Modal isOpen={!!sessionId} onClose={onClose} title="Session Attendance" size="xl">
      {loading ? (
        <div className="py-12 text-center"><Loader2 className="w-7 h-7 animate-spin text-brand-400 mx-auto"/></div>
      ) : data ? (
        <div className="space-y-4">
          {/* Session header */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
              <Icon className={clsx('w-5 h-5', cfg.color)}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{data.title}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                <span>{fmt(data.sessionDate)}</span>
                {data.startTime && <span>· {data.startTime}</span>}
                {data.location  && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3"/>{data.location}</span>}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-brand-600">{records.length}</p>
              <p className="text-xs text-gray-400">attended</p>
              {data.expectedCount > 0 && (
                <p className="text-xs text-gray-400">of {data.expectedCount} expected</p>
              )}
            </div>
          </div>

          {/* Method breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Manual', count: records.filter(r=>r.checkInMethod==='Manual').length,   color: 'blue'  },
              { label: 'QR Code', count: records.filter(r=>r.checkInMethod==='QR Code').length, color: 'green' },
            ].map(s => (
              <div key={s.label} className="card p-3 text-center">
                <p className={`text-lg font-bold text-${s.color}-600`}>{s.count}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Records list */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input className="input-field pl-9" placeholder="Search attendees..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No records</p>
            )}
            {filtered.map((r, i) => {
              const name = r.member?.fullName || r.guestName || 'Guest'
              const initials = name.split(' ').map(n=>n[0]).slice(0,2).join('')
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs text-gray-400 w-5 flex-shrink-0">{i+1}</span>
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className={clsx('px-1.5 py-0.5 rounded-full text-xs',
                        r.checkInMethod === 'QR Code'
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      )}>
                        {r.checkInMethod}
                      </span>
                      <span>{new Date(r.checkInTime).toLocaleTimeString('en-KE',{timeStyle:'short'})}</span>
                      {!r.memberId && <span className="text-orange-500">Guest</span>}
                    </div>
                  </div>
                  <button onClick={() => setDelId(r.id)}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
      <ConfirmDialog isOpen={!!delId} onClose={() => setDelId(null)}
        onConfirm={removeRecord} title="Remove Record?"
        message="This check-in record will be permanently removed." />
    </Modal>
  )
}
