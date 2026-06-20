import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  Users, Plus, QrCode, UserCheck, Download, RefreshCw,
  ChevronLeft, ChevronRight, Search, Filter, X, Loader2,
  CheckCircle2, Clock, Calendar, MapPin, Pencil, Trash2,
  Eye, BarChart2, UserPlus, Lock, Unlock, History,
  Sun, BookOpen, Mic2, Star, TrendingUp,
} from 'lucide-react'

// ── Constants ─────────────────────────────────────────────
const SERVICE_TYPES = [
  'Sunday Service','Midweek Service','Cell Group','Conference','Special Event','Other',
]
const TYPE_CONFIG = {
  'Sunday Service':  { icon: Sun,      color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/30' },
  'Midweek Service': { icon: BookOpen, color: 'text-blue-600',   bg: 'bg-blue-50   dark:bg-blue-900/30'   },
  'Cell Group':      { icon: Users,    color: 'text-green-600',  bg: 'bg-green-50  dark:bg-green-900/30'  },
  'Conference':      { icon: Mic2,     color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  'Special Event':   { icon: Star,     color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  'Other':           { icon: Calendar, color: 'text-gray-500',   bg: 'bg-gray-100  dark:bg-gray-700'      },
}
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })

// ── Session Form Modal ────────────────────────────────────
function SessionFormModal({ isOpen, onClose, onSuccess, initial }) {
  const empty = {
    title:'', serviceType:'Sunday Service', sessionDate:'',
    startTime:'', endTime:'', location:'', description:'',
    expectedCount:'', qrDurationMinutes:'120', notes:'',
  }
  const [form, setForm]   = useState(empty)
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { setForm(initial ? { ...empty, ...initial } : empty) }, [initial, isOpen])

  const submit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const body = {
        ...form,
        expectedCount:    form.expectedCount    ? Number(form.expectedCount)    : 0,
        qrDurationMinutes: form.qrDurationMinutes ? Number(form.qrDurationMinutes) : undefined,
      }
      if (initial?.id) await api.put(`/attendance/sessions/${initial.id}`, body)
      else             await api.post('/attendance/sessions', body)
      toast.success(initial ? 'Session updated' : 'Session created')
      onSuccess(); onClose()
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Session' : 'New Attendance Session'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Title <span className="text-red-400">*</span></label>
            <input className="input-field" placeholder="e.g. Sunday Morning Service"
              value={form.title} onChange={e => set('title', e.target.value)} required />
          </div>
          <div>
            <label className="label">Service Type <span className="text-red-400">*</span></label>
            <select className="input-field" value={form.serviceType} onChange={e => set('serviceType', e.target.value)}>
              {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date <span className="text-red-400">*</span></label>
            <input type="date" className="input-field" value={form.sessionDate}
              onChange={e => set('sessionDate', e.target.value)} required />
          </div>
          <div>
            <label className="label">Start Time</label>
            <input type="time" className="input-field" value={form.startTime}
              onChange={e => set('startTime', e.target.value)} />
          </div>
          <div>
            <label className="label">End Time</label>
            <input type="time" className="input-field" value={form.endTime}
              onChange={e => set('endTime', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Location</label>
            <input className="input-field" placeholder="e.g. Main Sanctuary"
              value={form.location} onChange={e => set('location', e.target.value)} />
          </div>
          <div>
            <label className="label">Expected Attendance</label>
            <input type="number" min="0" className="input-field" placeholder="0"
              value={form.expectedCount} onChange={e => set('expectedCount', e.target.value)} />
          </div>
          <div>
            <label className="label">QR Code Valid For (minutes)</label>
            <input type="number" min="1" className="input-field" placeholder="120"
              value={form.qrDurationMinutes} onChange={e => set('qrDurationMinutes', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description / Notes</label>
            <textarea className="input-field resize-none" rows={2}
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {initial ? 'Save Changes' : 'Create Session'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── QR Code Modal ─────────────────────────────────────────
function QrModal({ session, onClose }) {
  const [qrData,  setQrData]  = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!session) return
    setLoading(true)
    api.get(`/attendance/sessions/${session.id}/qrcode`)
      .then(r => setQrData(r.data.data))
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [session])

  const download = () => {
    if (!qrData?.qrCode) return
    const a = document.createElement('a')
    a.href     = qrData.qrCode
    a.download = `attendance-qr-${session.id}.png`
    a.click()
  }

  return (
    <Modal isOpen={!!session} onClose={onClose} title="QR Code Check-In" size="sm">
      <div className="text-center space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{session?.title}</p>
          <p className="text-xs text-gray-400">{session ? fmtDate(session.sessionDate) : ''} · {session?.serviceType}</p>
        </div>

        {loading && <div className="py-8"><Loader2 className="w-8 h-8 animate-spin text-brand-400 mx-auto" /></div>}

        {qrData && (
          <>
            <div className="flex justify-center">
              <img src={qrData.qrCode} alt="QR Code"
                className="w-56 h-56 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg" />
            </div>

            {qrData.expiresAt && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                Expires: {new Date(qrData.expiresAt).toLocaleString('en-KE', { dateStyle:'short', timeStyle:'short' })}
              </div>
            )}

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-left">
              <p className="text-xs text-gray-400 mb-1">Check-In URL</p>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all">{qrData.checkInUrl}</p>
            </div>

            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={download} className="btn-primary text-sm">
                <Download className="w-4 h-4" /> Download PNG
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(qrData.checkInUrl); toast.success('URL copied!') }}
                className="btn-secondary text-sm">
                Copy URL
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

// ── Manual Check-In Modal ─────────────────────────────────
function CheckInModal({ session, onClose, onSuccess }) {
  const [mode,     setMode]    = useState('member')
  const [members,  setMembers] = useState([])
  const [search,   setSearch]  = useState('')
  const [selected, setSelected] = useState(null)
  const [guest,    setGuest]   = useState({ name: '', phone: '' })
  const [notes,    setNotes]   = useState('')
  const [loading,  setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!session) return
    setFetching(true)
    api.get('/members', { params: { limit: 300, status: 'active' } })
      .then(r => setMembers(r.data.data?.rows || r.data.data || []))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [session])

  const filtered = members.filter(m =>
    !search ||
    (m.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.phone || '').includes(search)
  )

  const submit = async () => {
    if (mode === 'member' && !selected) { toast.error('Select a member'); return }
    if (mode === 'guest'  && !guest.name.trim()) { toast.error('Enter guest name'); return }
    setLoading(true)
    try {
      const body = mode === 'member'
        ? { memberId: selected.id, notes }
        : { guestName: guest.name.trim(), guestPhone: guest.phone || undefined, notes }
      await api.post(`/attendance/sessions/${session.id}/checkin`, body)
      toast.success(mode === 'member' ? `${selected.fullName} checked in ✓` : `${guest.name} checked in ✓`)
      onSuccess()
      setSelected(null); setGuest({ name:'', phone:'' }); setNotes(''); setSearch('')
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Modal isOpen={!!session} onClose={onClose} title="Manual Check-In" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Session: <span className="font-semibold text-gray-800 dark:text-gray-100">{session?.title}</span>
        </p>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {[['member','Member'], ['guest','Guest / Walk-in']].map(([val, label]) => (
            <button key={val} onClick={() => { setMode(val); setSelected(null) }}
              className={clsx('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                mode === val
                  ? 'bg-white dark:bg-gray-700 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}>
              {label}
            </button>
          ))}
        </div>

        {mode === 'member' ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input-field pl-9" placeholder="Search by name or phone…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
              {fetching && <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin text-brand-400 mx-auto" /></div>}
              {!fetching && filtered.length === 0 && (
                <p className="text-sm text-gray-400 text-center p-4">No members found</p>
              )}
              {filtered.map(m => (
                <button key={m.id} type="button"
                  onClick={() => setSelected(selected?.id === m.id ? null : m)}
                  className={clsx('w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    selected?.id === m.id
                      ? 'bg-brand-50 dark:bg-brand-900/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  )}>
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 flex-shrink-0">
                    {(m.fullName || '').split(' ').map(n => n[0]).slice(0, 2).join('') || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{m.fullName}</p>
                    <p className="text-xs text-gray-400">{m.phone || '—'}</p>
                  </div>
                  {selected?.id === m.id && <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
            {selected && (
              <p className="text-xs text-brand-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selected: {selected.fullName}
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="label">Full Name <span className="text-red-400">*</span></label>
              <input className="input-field" placeholder="Guest full name"
                value={guest.name} onChange={e => setGuest(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone (optional)</label>
              <input className="input-field" placeholder="+254…"
                value={guest.phone} onChange={e => setGuest(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
        )}

        <div>
          <label className="label">Notes (optional)</label>
          <input className="input-field" placeholder="Any notes…"
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            Check In
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ── Session Detail Modal ──────────────────────────────────
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
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [sessionId])

  useEffect(() => { load() }, [load])

  const removeRecord = async () => {
    try {
      await api.delete(`/attendance/records/${delId}`)
      toast.success('Record removed'); setDelId(null); load()
    } catch (e) { toast.error(e.message) }
  }

  const records  = data?.records || []
  const filtered = records.filter(r => {
    const name = r.member?.fullName || r.guestName || ''
    return !search || name.toLowerCase().includes(search.toLowerCase())
  })
  const cfg  = TYPE_CONFIG[data?.serviceType] || TYPE_CONFIG['Other']
  const Icon = cfg.icon

  return (
    <Modal isOpen={!!sessionId} onClose={onClose} title="Session Attendance" size="xl">
      {loading ? (
        <div className="py-12 text-center"><Loader2 className="w-7 h-7 animate-spin text-brand-400 mx-auto" /></div>
      ) : data ? (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
              <Icon className={clsx('w-5 h-5', cfg.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{data.title}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                <span>{fmtDate(data.sessionDate)}</span>
                {data.startTime && <span>· {data.startTime}</span>}
                {data.location  && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{data.location}</span>}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',   v: records.length,                                        color: 'brand'  },
              { label: 'Members', v: records.filter(r => r.memberId).length,                color: 'blue'   },
              { label: 'Guests',  v: records.filter(r => !r.memberId).length,               color: 'orange' },
              { label: 'QR Scan', v: records.filter(r => r.checkInMethod==='QR Code').length, color: 'green'  },
            ].map(s => (
              <div key={s.label} className="card p-3 text-center">
                <p className={`text-lg font-bold text-${s.color}-600`}>{s.v}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search attendees…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No records</p>
            )}
            {filtered.map((r, i) => {
              const name    = r.member?.fullName || r.guestName || 'Guest'
              const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('')
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/20">
                  <span className="text-xs text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span className={clsx('px-1.5 py-0.5 rounded-full',
                        r.checkInMethod === 'QR Code'
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      )}>
                        {r.checkInMethod}
                      </span>
                      <span>{new Date(r.checkInTime).toLocaleTimeString('en-KE', { timeStyle:'short' })}</span>
                      {!r.memberId && <span className="text-orange-500">Guest</span>}
                    </div>
                  </div>
                  <button onClick={() => setDelId(r.id)}
                    className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      <ConfirmDialog isOpen={!!delId} onClose={() => setDelId(null)}
        onConfirm={removeRecord} title="Remove Record?"
        message="This check-in record will be permanently deleted." />
    </Modal>
  )
}

// ── Member History Modal ──────────────────────────────────
function MemberHistoryModal({ memberId, memberName, onClose }) {
  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(false)
  const LIMIT = 15

  const load = useCallback(async (p = 1) => {
    if (!memberId) return
    setLoading(true)
    try {
      const r = await api.get(`/attendance/member/${memberId}`, { params: { page: p, limit: LIMIT } })
      setRows(r.data.data?.records || [])
      setTotal(r.data.meta?.total || 0)
      setPage(p)
    } catch (e) { toast.error(e.message) }
    finally { setLoading(false) }
  }, [memberId])

  useEffect(() => { load(1) }, [load])

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <Modal isOpen={!!memberId} onClose={onClose} title={`Attendance — ${memberName || ''}`} size="lg">
      <div className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-brand-600">{total}</p>
            <p className="text-xs text-gray-400">Sessions</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-green-600">{rows.filter(r => r.checkInMethod === 'QR Code').length}</p>
            <p className="text-xs text-gray-400">QR Check-ins</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{rows.filter(r => r.checkInMethod === 'Manual').length}</p>
            <p className="text-xs text-gray-400">Manual Check-ins</p>
          </div>
        </div>

        {/* Records */}
        {loading ? (
          <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto" /></div>
        ) : (
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700 max-h-80 overflow-y-auto">
            {rows.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No attendance records found</p>
            )}
            {rows.map(r => {
              const s    = r.session
              const cfg  = TYPE_CONFIG[s?.serviceType] || TYPE_CONFIG['Other']
              const SIcon = cfg.icon
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
                    <SIcon className={clsx('w-4 h-4', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{s?.title}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{s?.sessionDate ? fmtDate(s.sessionDate) : '—'}</span>
                      <span>·</span>
                      <span>{s?.serviceType}</span>
                      {s?.location && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{s.location}</span>}
                    </div>
                  </div>
                  <span className={clsx('badge text-xs flex-shrink-0',
                    r.checkInMethod === 'QR Code'
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  )}>
                    {r.checkInMethod}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => load(page - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button disabled={page >= totalPages} onClick={() => load(page + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function Attendance() {
  const { user } = useAuth()
  const canManage = ['administrator', 'treasurer'].includes(user?.role)

  // List state
  const [sessions, setSessions] = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(false)
  const [stats,    setStats]    = useState(null)

  // Filters
  const [serviceType, setServiceType] = useState('')
  const [startDate,   setStartDate]   = useState('')
  const [endDate,     setEndDate]     = useState('')
  const [showFilter,  setShowFilter]  = useState(false)

  // Modal state
  const [formOpen,      setFormOpen]      = useState(false)
  const [editSession,   setEditSession]   = useState(null)
  const [qrSession,     setQrSession]     = useState(null)
  const [checkInSession, setCheckInSession] = useState(null)
  const [detailId,      setDetailId]      = useState(null)
  const [historyMember, setHistoryMember] = useState(null)
  const [deleteId,      setDeleteId]      = useState(null)
  const [deleteTitle,   setDeleteTitle]   = useState('')

  const LIMIT = 15

  // ── Fetch sessions ───────────────────────────────────────
  const fetchSessions = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: LIMIT }
      if (serviceType) params.serviceType = serviceType
      if (startDate)   params.startDate   = startDate
      if (endDate)     params.endDate     = endDate
      const r = await api.get('/attendance/sessions', { params })
      setSessions(r.data.data || [])
      setTotal(r.data.meta?.total || 0)
      setPage(p)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [serviceType, startDate, endDate])

  const fetchStats = useCallback(async () => {
    try {
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate)   params.endDate   = endDate
      const r = await api.get('/attendance/stats', { params })
      setStats(r.data.data)
    } catch (_) {}
  }, [startDate, endDate])

  useEffect(() => { fetchSessions(1) }, [fetchSessions])
  useEffect(() => { fetchStats() },    [fetchStats])

  // ── Toggle session open/close ────────────────────────────
  const toggleOpen = async (s) => {
    try {
      if (s.isOpen) await api.patch(`/attendance/sessions/${s.id}/close`)
      else          await api.patch(`/attendance/sessions/${s.id}/reopen`)
      toast.success(s.isOpen ? 'Session closed' : 'Session reopened')
      fetchSessions(page)
    } catch (err) { toast.error(err.message) }
  }

  // ── Delete ───────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await api.delete(`/attendance/sessions/${deleteId}`)
      toast.success('Session deleted')
      setDeleteId(null); setDeleteTitle('')
      fetchSessions(1); fetchStats()
    } catch (err) { toast.error(err.message) }
  }

  // ── Export CSV ───────────────────────────────────────────
  const exportCsv = async () => {
    try {
      const base    = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const stored  = JSON.parse(sessionStorage.getItem('glc_user') || '{}')
      const params  = new URLSearchParams()
      if (serviceType) params.set('serviceType', serviceType)
      if (startDate)   params.set('startDate',   startDate)
      if (endDate)     params.set('endDate',      endDate)
      const resp = await fetch(`${base}/attendance/report?${params}`, {
        headers: { Authorization: `Bearer ${stored?.token || ''}` },
      })
      if (!resp.ok) throw new Error('Export failed')
      const blob = await resp.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `attendance-${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
      toast.success('Report exported')
    } catch (err) { toast.error(err.message) }
  }

  const hasFilter  = serviceType || startDate || endDate
  const totalPages = Math.ceil(total / LIMIT)
  const clearFilter = () => { setServiceType(''); setStartDate(''); setEndDate('') }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Attendance Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track attendance for services, cell groups and conferences</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { fetchSessions(1); fetchStats() }} className="btn-secondary" title="Refresh">
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setShowFilter(f => !f)}
            className={clsx('btn-secondary', hasFilter && 'border-brand-400 text-brand-600')}>
            <Filter className="w-4 h-4" /> Filters
            {hasFilter && <span className="ml-1 w-2 h-2 bg-brand-500 rounded-full inline-block" />}
          </button>
          <button onClick={exportCsv} className="btn-secondary">
            <Download className="w-4 h-4" /> Export
          </button>
          {canManage && (
            <button onClick={() => { setEditSession(null); setFormOpen(true) }} className="btn-primary">
              <Plus className="w-4 h-4" /> New Session
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Sessions',    value: stats.totalSessions,  color: 'brand'  },
            { label: 'Total Attended',    value: stats.totalAttendance, color: 'green'  },
            { label: 'Avg per Session',   value: stats.avgAttendance,  color: 'blue'   },
            { label: 'Service Types',     value: stats.byType?.length || 0, color: 'purple' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <p className={`text-xl font-bold text-${s.color}-600`}>{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Service type pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setServiceType('')}
          className={clsx('px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
            !serviceType
              ? 'bg-brand-600 text-white border-brand-600'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-brand-300'
          )}>
          All
        </button>
        {SERVICE_TYPES.map(t => {
          const cfg  = TYPE_CONFIG[t]
          const Icon = cfg.icon
          return (
            <button key={t} onClick={() => setServiceType(serviceType === t ? '' : t)}
              className={clsx('px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-1.5 transition-colors',
                serviceType === t
                  ? `${cfg.bg} ${cfg.color} border-current`
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300'
              )}>
              <Icon className="w-3.5 h-3.5" />{t}
            </button>
          )
        })}
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
              <Filter className="w-4 h-4" /> Date Range
            </p>
            {hasFilter && (
              <button onClick={clearFilter} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">From</label>
              <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {total > 0 ? `${total} session${total !== 1 ? 's' : ''}` : 'No sessions'}
          </p>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-brand-600" />}
        </div>

        {!loading && sessions.length === 0 && (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No sessions found</p>
            {canManage && (
              <button onClick={() => setFormOpen(true)} className="mt-3 btn-primary text-sm">
                <Plus className="w-4 h-4" /> Create first session
              </button>
            )}
          </div>
        )}

        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {sessions.map(s => {
            const cfg  = TYPE_CONFIG[s.serviceType] || TYPE_CONFIG['Other']
            const Icon = cfg.icon
            return (
              <div key={s.id} className="px-5 py-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                {/* Icon */}
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
                  <Icon className={clsx('w-5 h-5', cfg.color)} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-800 dark:text-gray-100">{s.title}</p>
                    <span className={clsx('badge text-xs', cfg.bg, cfg.color)}>{s.serviceType}</span>
                    <span className={clsx('badge text-xs', s.isOpen
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500')}>
                      {s.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(s.sessionDate)}</span>
                    {s.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.startTime}</span>}
                    {s.location  && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location}</span>}
                    {s.expectedCount > 0 && <span>Expected: {s.expectedCount}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                  <button onClick={() => setDetailId(s.id)} title="View attendees"
                    className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/30 text-gray-400 hover:text-brand-600 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  {canManage && (
                    <>
                      <button onClick={() => setQrSession(s)} title="QR Code"
                        className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30 text-gray-400 hover:text-purple-600 transition-colors">
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button onClick={() => setCheckInSession(s)} title="Manual check-in"
                        className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-600 transition-colors"
                        disabled={!s.isOpen}>
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleOpen(s)} title={s.isOpen ? 'Close session' : 'Reopen session'}
                        className={clsx('p-1.5 rounded-lg transition-colors',
                          s.isOpen
                            ? 'hover:bg-orange-50 dark:hover:bg-orange-900/30 text-gray-400 hover:text-orange-600'
                            : 'hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-600'
                        )}>
                        {s.isOpen ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button onClick={() => { setEditSession(s); setFormOpen(true) }} title="Edit"
                        className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setDeleteId(s.id); setDeleteTitle(s.title) }} title="Delete"
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => fetchSessions(page - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i
                if (p < 1 || p > totalPages) return null
                return (
                  <button key={p} onClick={() => fetchSessions(p)}
                    className={clsx('w-7 h-7 text-xs rounded-lg font-medium transition-colors',
                      p === page ? 'bg-brand-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                    )}>
                    {p}
                  </button>
                )
              })}
              <button disabled={page >= totalPages} onClick={() => fetchSessions(page + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SessionFormModal isOpen={formOpen} onClose={() => { setFormOpen(false); setEditSession(null) }}
        onSuccess={() => { fetchSessions(1); fetchStats() }} initial={editSession} />
      <QrModal session={qrSession} onClose={() => setQrSession(null)} />
      <CheckInModal session={checkInSession} onClose={() => setCheckInSession(null)}
        onSuccess={() => fetchSessions(page)} />
      <SessionDetailModal sessionId={detailId} onClose={() => setDetailId(null)} />
      {historyMember && (
        <MemberHistoryModal memberId={historyMember.id} memberName={historyMember.name}
          onClose={() => setHistoryMember(null)} />
      )}
      <ConfirmDialog isOpen={!!deleteId} onClose={() => { setDeleteId(null); setDeleteTitle('') }}
        onConfirm={handleDelete} title="Delete Session?"
        message={`"${deleteTitle}" and all its attendance records will be permanently deleted.`} />
    </div>
  )
}
