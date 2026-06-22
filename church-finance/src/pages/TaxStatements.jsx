import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  FileText, Download, Users, Search, RefreshCw,
  Calendar, CheckSquare, Square, FileDown, Loader2,
  TrendingUp, Shield, AlertCircle, ChevronDown,
} from 'lucide-react'

const CUR_YEAR = new Date().getFullYear()
const YEARS    = Array.from({ length: 6 }, (_, i) => CUR_YEAR - i)
const QUARTERS = [
  { value: '1', label: 'Q1 — Jan to Mar' },
  { value: '2', label: 'Q2 — Apr to Jun' },
  { value: '3', label: 'Q3 — Jul to Sep' },
  { value: '4', label: 'Q4 — Oct to Dec' },
]

const fmt = (v) =>
  'KES ' + Number(v || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

// ── Period selector ───────────────────────────────────────────────────────────

function PeriodSelector({ period, onChange }) {
  const { type, year, quarter, startDate, endDate } = period
  const set = (k, v) => onChange({ ...period, [k]: v })

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Calendar className="w-4 h-4 text-brand-500" />
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Select Period</h3>
      </div>

      {/* Type pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'annual',    label: 'Annual'      },
          { id: 'quarterly', label: 'Quarterly'   },
          { id: 'custom',    label: 'Custom Range' },
        ].map(t => (
          <button key={t.id} onClick={() => set('type', t.id)}
            className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold transition-all border',
              type === t.id
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-brand-400')}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Year always shown */}
        <div>
          <label className="label">Year</label>
          <select className="input-field" value={year} onChange={e => set('year', e.target.value)}>
            {YEARS.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>

        {type === 'quarterly' && (
          <div>
            <label className="label">Quarter</label>
            <select className="input-field" value={quarter} onChange={e => set('quarter', e.target.value)}>
              {QUARTERS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
            </select>
          </div>
        )}

        {type === 'custom' && (
          <>
            <div>
              <label className="label">From</label>
              <input type="date" className="input-field" value={startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input-field" value={endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Member row ────────────────────────────────────────────────────────────────

function MemberRow({ member, selected, onToggle, onDownload, downloading }) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <td className="table-cell w-10">
        <button onClick={() => onToggle(member.id)} className="text-brand-600 dark:text-brand-400">
          {selected
            ? <CheckSquare className="w-4 h-4" />
            : <Square className="w-4 h-4 text-gray-300 dark:text-gray-500" />}
        </button>
      </td>
      <td className="table-cell">
        <div className="font-medium text-gray-900 dark:text-gray-100">{member.fullName}</div>
        <div className="text-xs text-gray-400">{member.email || member.phone}</div>
      </td>
      <td className="table-cell text-center">
        <span className="badge bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          {member.count}
        </span>
      </td>
      <td className="table-cell text-right font-semibold text-green-600 dark:text-green-400">
        {fmt(member.total)}
      </td>
      <td className="table-cell text-right">
        <button
          onClick={() => onDownload(member.id)}
          disabled={downloading === member.id}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100 disabled:opacity-50"
        >
          {downloading === member.id
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Download className="w-3.5 h-3.5" />}
          PDF
        </button>
      </td>
    </tr>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function TaxStatements() {
  const { user } = useAuth()

  const [period, setPeriod] = useState({
    type: 'annual', year: String(CUR_YEAR), quarter: '1', startDate: '', endDate: '',
  })
  const [members,    setMembers]    = useState([])
  const [search,     setSearch]     = useState('')
  const [selected,   setSelected]   = useState(new Set())
  const [loading,    setLoading]    = useState(false)
  const [previewed,  setPreviewed]  = useState(false)
  const [summary,    setSummary]    = useState(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [downloading,  setDownloading]  = useState(null) // memberId being downloaded

  // Build query params from period
  const periodParams = useCallback(() => {
    const p = {}
    if (period.type === 'annual')    { p.year = period.year }
    if (period.type === 'quarterly') { p.year = period.year; p.quarter = period.quarter }
    if (period.type === 'custom')    { p.startDate = period.startDate; p.endDate = period.endDate }
    return p
  }, [period])

  // Load members with contributions
  const loadMembers = useCallback(async () => {
    setLoading(true)
    setPreviewed(false)
    try {
      const params = { ...periodParams(), search }
      const [membersRes, previewRes] = await Promise.all([
        api.get('/tax-statements/members', { params }),
        api.get('/tax-statements/preview', { params: periodParams() }),
      ])
      setMembers(membersRes.data.data || [])
      setSummary(previewRes.data.data)
      setSelected(new Set((membersRes.data.data || []).map(m => m.id)))
      setPreviewed(true)
    } catch (err) {
      toast.error(err.message || 'Failed to load member data')
    } finally { setLoading(false) }
  }, [periodParams, search])

  const toggleMember = (id) => {
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === members.length) setSelected(new Set())
    else setSelected(new Set(members.map(m => m.id)))
  }

  // Download single member PDF
  const downloadSingle = async (memberId) => {
    setDownloading(memberId)
    try {
      const params = periodParams()
      const url    = `/tax-statements/${memberId}/single`
      const resp   = await api.get(url, { params, responseType: 'blob' })
      const blob   = new Blob([resp.data], { type: 'application/pdf' })
      const link   = document.createElement('a')
      link.href    = URL.createObjectURL(blob)
      const member = members.find(m => m.id === memberId)
      link.download = `tax-statement-${member?.fullName?.replace(/\s+/g, '-') || memberId}-${period.year || 'period'}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('Statement downloaded')
    } catch (err) { toast.error(err.message || 'Download failed') }
    finally { setDownloading(null) }
  }

  // Batch download ZIP
  const downloadBatch = async () => {
    if (!selected.size) { toast.error('Select at least one member'); return }
    setBatchLoading(true)
    try {
      const body   = { ...periodParams(), memberIds: [...selected] }
      const resp   = await api.post('/tax-statements/batch', body, { responseType: 'blob' })
      const blob   = new Blob([resp.data], { type: 'application/zip' })
      const link   = document.createElement('a')
      link.href    = URL.createObjectURL(blob)
      link.download = `tax-statements-${period.year || 'period'}.zip`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success(`${selected.size} statement(s) downloaded as ZIP`)
    } catch (err) { toast.error(err.message || 'Batch download failed') }
    finally { setBatchLoading(false) }
  }

  const filteredMembers = members.filter(m =>
    !search || m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const selectedTotal = members
    .filter(m => selected.has(m.id))
    .reduce((s, m) => s + (m.total || 0), 0)

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" /> Tax-Exempt Statements
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Generate downloadable contribution statements for KRA tax relief claims
          </p>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="rounded-xl p-4 flex gap-3 border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
        <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <span className="font-semibold">How it works:</span> Select a period, click <em>Load Members</em> to preview contributions,
          then download individual PDFs or batch-generate a ZIP for all selected members.
          Each PDF is a signed tax-exempt statement compliant with KRA requirements.
        </div>
      </div>

      {/* ── Period selector ── */}
      <PeriodSelector period={period} onChange={setPeriod} />

      {/* ── Load button ── */}
      <button onClick={loadMembers} disabled={loading}
        className="btn-primary disabled:opacity-60 w-full sm:w-auto justify-center">
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading…</>
          : <><RefreshCw className="w-4 h-4" /> Load Members & Preview</>}
      </button>

      {/* ── Summary cards ── */}
      {previewed && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Period',       value: summary.period,                       icon: Calendar,    color: 'text-brand-600' },
            { label: 'Members',      value: summary.totalMembers,                 icon: Users,       color: 'text-blue-600'  },
            { label: 'Grand Total',  value: fmt(summary.grandTotal),              icon: TrendingUp,  color: 'text-green-600' },
            { label: 'Selected',     value: `${selected.size} / ${members.length}`, icon: FileText,  color: 'text-purple-600' },
          ].map(item => (
            <div key={item.label} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className={clsx('w-4 h-4', item.color)} />
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
              <div className={clsx('text-lg font-bold truncate', item.color)}>{item.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Member table ── */}
      {previewed && (
        <div className="card overflow-hidden">
          {/* Table toolbar */}
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input-field pl-9 w-56" placeholder="Search members..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <span className="text-sm text-gray-400">{filteredMembers.length} members</span>
            </div>
            <div className="flex items-center gap-2">
              {selected.size > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                  {selected.size} selected · {fmt(selectedTotal)}
                </span>
              )}
              <button onClick={downloadBatch} disabled={batchLoading || !selected.size}
                className="btn-primary disabled:opacity-60">
                {batchLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                  : <><FileDown className="w-4 h-4" /> Download ZIP ({selected.size})</>}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header w-10">
                    <button onClick={toggleAll} className="text-brand-600 dark:text-brand-400">
                      {selected.size === members.length && members.length > 0
                        ? <CheckSquare className="w-4 h-4" />
                        : <Square className="w-4 h-4 text-gray-400" />}
                    </button>
                  </th>
                  <th className="table-header">Member</th>
                  <th className="table-header text-center">Transactions</th>
                  <th className="table-header text-right">Total Contributions</th>
                  <th className="table-header text-right">Statement</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-cell text-center text-gray-400 py-10">
                      No members with contributions found for this period.
                    </td>
                  </tr>
                )}
                {filteredMembers.map(m => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    selected={selected.has(m.id)}
                    onToggle={toggleMember}
                    onDownload={downloadSingle}
                    downloading={downloading}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {filteredMembers.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm">
              <span className="text-gray-400">{filteredMembers.length} members with contributions</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                Grand Total: {fmt(summary?.grandTotal)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
