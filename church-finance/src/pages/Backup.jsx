import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import ConfirmDialog from '../components/common/ConfirmDialog'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  Database, Download, Upload, Plus, CheckCircle2, Clock, Trash2,
  RefreshCw, Loader2, Shield, AlertTriangle, Calendar, Settings2,
  HardDrive, RotateCcw, History, Zap, Info, CloudUpload,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────
const fmtDate = (d) =>
  new Date(d).toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })

const FREQ_LABELS = {
  hourly: 'Every Hour', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
}

// ─── Auto-Backup Schedule Panel ───────────────────────────
function SchedulePanel({ onSaved }) {
  const [schedule, setSchedule] = useState({
    enabled: false, frequency: 'daily', time: '02:00', retainDays: 30,
  })
  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(true)

  const load = async () => {
    setFetching(true)
    try {
      const r = await api.get('/backup/schedule')
      setSchedule(r.data.data)
    } catch (_) {}
    finally { setFetching(false) }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setLoading(true)
    try {
      await api.put('/backup/schedule', schedule)
      toast.success(schedule.enabled
        ? `Auto-backup enabled (${FREQ_LABELS[schedule.frequency]} at ${schedule.time})`
        : 'Auto-backup disabled')
      onSaved?.()
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  const set = (k, v) => setSchedule(p => ({ ...p, [k]: v }))

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Auto-Backup Schedule</p>
            <p className="text-xs text-gray-400">Automatically backup the database on a schedule</p>
          </div>
        </div>
        {/* Toggle */}
        <button
          onClick={() => set('enabled', !schedule.enabled)}
          className={clsx(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
            schedule.enabled ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-600'
          )}
        >
          <span className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            schedule.enabled ? 'translate-x-6' : 'translate-x-1'
          )} />
        </button>
      </div>

      {fetching ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-brand-400" /></div>
      ) : (
        <div className={clsx('space-y-3 transition-opacity', !schedule.enabled && 'opacity-40 pointer-events-none')}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">Frequency</label>
              <select className="input-field" value={schedule.frequency} onChange={e => set('frequency', e.target.value)}>
                <option value="hourly">Every Hour</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {schedule.frequency !== 'hourly' && (
              <div>
                <label className="label">Time</label>
                <input type="time" className="input-field" value={schedule.time}
                  onChange={e => set('time', e.target.value)} />
              </div>
            )}
            <div>
              <label className="label">Retain (days)</label>
              <input type="number" min="1" max="365" className="input-field"
                value={schedule.retainDays} onChange={e => set('retainDays', Number(e.target.value))} />
            </div>
          </div>

          {schedule.enabled && (
            <div className="flex items-center gap-2 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
              <Info className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <p className="text-xs text-brand-700 dark:text-brand-300">
                Backups will run <strong>{FREQ_LABELS[schedule.frequency]}</strong>
                {schedule.frequency !== 'hourly' && ` at ${schedule.time}`}.
                Files older than <strong>{schedule.retainDays} days</strong> will be purged automatically (keeping at least 5).
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={save} disabled={loading || fetching} className="btn-primary disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings2 className="w-4 h-4" />}
          Save Schedule
        </button>
      </div>
    </div>
  )
}

// ─── Restore Warning Banner ────────────────────────────────
function RestoreWarning({ filename, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Confirm Database Restore</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This will <strong className="text-red-600">overwrite all current data</strong> with the contents of:
            </p>
            <p className="mt-2 text-xs font-mono bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 break-all">
              {filename}
            </p>
          </div>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            This action cannot be undone. We recommend creating a fresh backup before restoring.
          </p>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" /> Yes, Restore
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function Backup() {
  const { user } = useAuth()
  const isAdmin  = user?.role === 'administrator'

  const [backups,       setBackups]       = useState([])
  const [stats,         setStats]         = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [creating,      setCreating]      = useState(false)
  const [restoring,     setRestoring]     = useState(false)
  const [downloading,   setDownloading]   = useState(null)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [restoreTarget, setRestoreTarget] = useState(null)

  const fileRef = useRef()

  // ── Data fetching ──────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        api.get('/backup/list'),
        api.get('/backup/stats'),
      ])
      setBackups(listRes.data.data  || [])
      setStats(statsRes.data.data   || null)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Manual backup ──────────────────────────────────────
  const handleCreate = async () => {
    setCreating(true)
    try {
      const r = await api.post('/backup/create')
      toast.success(`Backup created: ${r.data.data?.sizeFormatted || ''}`)
      fetchAll()
    } catch (err) { toast.error(err.message) }
    finally { setCreating(false) }
  }

  // ── Download ───────────────────────────────────────────
  const handleDownload = async (filename) => {
    setDownloading(filename)
    try {
      const base   = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const stored = JSON.parse(sessionStorage.getItem('glc_user') || '{}')
      const resp   = await fetch(`${base}/backup/download/${encodeURIComponent(filename)}`, {
        headers: { Authorization: `Bearer ${stored?.token || ''}` },
      })
      if (!resp.ok) throw new Error('Download failed')
      const blob = await resp.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
      toast.success('Download started')
    } catch (err) { toast.error(err.message) }
    finally { setDownloading(null) }
  }

  // ── Delete ─────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await api.delete(`/backup/${encodeURIComponent(deleteTarget)}`)
      toast.success('Backup deleted')
      setDeleteTarget(null); fetchAll()
    } catch (err) { toast.error(err.message) }
  }

  // ── Restore from server file ────────────────────────────
  const handleRestoreFromServer = async () => {
    setRestoring(true)
    try {
      await api.post(`/backup/restore/${encodeURIComponent(restoreTarget)}`)
      toast.success('Database restored successfully')
      setRestoreTarget(null); fetchAll()
    } catch (err) { toast.error(err.message) }
    finally { setRestoring(false) }
  }

  // ── Restore from uploaded file ──────────────────────────
  const handleUploadRestore = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith('.sql')) { toast.error('Only .sql files are accepted'); return }

    const confirmed = window.confirm(
      `Restore from "${file.name}"?\n\nThis will OVERWRITE all current data. This cannot be undone.`
    )
    if (!confirmed) { e.target.value = ''; return }

    setRestoring(true)
    const fd     = new FormData()
    fd.append('file', file)
    try {
      const base   = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const stored = JSON.parse(sessionStorage.getItem('glc_user') || '{}')
      const resp   = await fetch(`${base}/backup/restore/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${stored?.token || ''}` },
        body: fd,
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.message || 'Restore failed')
      toast.success(data.message || 'Database restored')
      fetchAll()
    } catch (err) { toast.error(err.message) }
    finally { setRestoring(false); e.target.value = '' }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Backup &amp; Restore</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create, schedule, download and restore database backups</p>
        </div>
        <button onClick={fetchAll} className="btn-secondary w-fit" title="Refresh">
          <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Database,   label: 'Backups',       value: stats.count,            color: 'brand'  },
            { icon: HardDrive,  label: 'Storage Used',  value: stats.totalSizeFormatted, color: 'blue'   },
            { icon: Clock,      label: 'Latest',        value: stats.latest ? fmtDate(stats.latest.createdAt) : '—', color: 'green'  },
            { icon: Zap,        label: 'Auto-Backup',   value: stats.autoEnabled ? 'Enabled' : 'Off',  color: stats.autoEnabled ? 'purple' : 'gray' },
          ].map(s => (
            <div key={s.label} className="card p-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-3.5 h-3.5 text-${s.color}-500`} />
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
              <p className={`text-sm font-bold text-${s.color}-600 truncate`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Admin-only warning */}
      {!isAdmin && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">Backup and restore operations are restricted to administrators.</p>
        </div>
      )}

      {isAdmin && (
        <>
          {/* Action cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Manual backup */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Manual Backup</p>
                  <p className="text-xs text-gray-400">Create a backup right now</p>
                </div>
              </div>
              <button onClick={handleCreate} disabled={creating}
                className="btn-primary w-full justify-center disabled:opacity-60">
                {creating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                  : <><Plus className="w-4 h-4" /> Create Backup Now</>
                }
              </button>
            </div>

            {/* Upload restore */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CloudUpload className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Restore from File</p>
                  <p className="text-xs text-gray-400">Upload a .sql backup file</p>
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                  This overwrites all current data. Create a backup first.
                </p>
              </div>
              <label className={clsx('btn-secondary w-full justify-center cursor-pointer', restoring && 'opacity-60 pointer-events-none')}>
                {restoring
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Restoring…</>
                  : <><Upload className="w-4 h-4" /> Choose .sql File</>
                }
                <input ref={fileRef} type="file" accept=".sql" onChange={handleUploadRestore} className="hidden" />
              </label>
            </div>
          </div>

          {/* Auto-backup schedule */}
          <SchedulePanel onSaved={fetchAll} />
        </>
      )}

      {/* Backup history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
          <p className="font-semibold text-gray-700 dark:text-gray-200 text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-brand-600" /> Backup History
          </p>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-brand-600" />}
        </div>

        {!loading && backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Database className="w-10 h-10 text-gray-200 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-400">No backups yet</p>
            <p className="text-xs text-gray-300 dark:text-gray-500 mt-1">Create your first backup above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {backups.map(b => (
              <div key={b.filename} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    b.isAuto ? 'bg-purple-50 dark:bg-purple-900/30' : 'bg-green-50 dark:bg-green-900/30')}>
                    {b.isAuto
                      ? <Zap className="w-4 h-4 text-purple-600" />
                      : <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{b.filename}</p>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mt-0.5">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate(b.createdAt)}</span>
                      <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{b.sizeFormatted}</span>
                      <span className={clsx('badge text-xs',
                        b.isAuto
                          ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      )}>
                        {b.isAuto ? 'Auto' : 'Manual'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Download */}
                  <button onClick={() => handleDownload(b.filename)}
                    disabled={downloading === b.filename}
                    title="Download"
                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50">
                    {downloading === b.filename
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                  </button>

                  {/* Restore from server */}
                  {isAdmin && (
                    <button onClick={() => setRestoreTarget(b.filename)}
                      title="Restore database from this backup"
                      className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 text-gray-400 hover:text-orange-600 transition-colors">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete */}
                  {isAdmin && (
                    <button onClick={() => setDeleteTarget(b.filename)}
                      title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security note */}
      <div className="flex items-start gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
        <Shield className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-400 leading-relaxed">
          Backup files contain the full database dump including all financial records, members, and settings.
          Store downloaded backups securely. Backups are saved to the <code className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">backups/</code> directory on the server.
        </p>
      </div>

      {/* Restore confirm */}
      {restoreTarget && (
        <RestoreWarning
          filename={restoreTarget}
          onCancel={() => setRestoreTarget(null)}
          onConfirm={handleRestoreFromServer}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Backup?"
        message={`"${deleteTarget}" will be permanently deleted from the server.`}
      />
    </div>
  )
}
