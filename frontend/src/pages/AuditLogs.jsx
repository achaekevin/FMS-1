import { useState, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import Pagination from '../components/common/Pagination'
import usePagination from '../hooks/usePagination'
import {
  ClipboardList, Search, PlusCircle, Pencil, Trash2,
  LogIn, FileDown, Smartphone, Filter
} from 'lucide-react'
import clsx from 'clsx'
import { formatRelativeTime } from '../utils/mockData'

const typeConfig = {
  create:  { icon: PlusCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Create' },
  update:  { icon: Pencil,     color: 'text-blue-600',  bg: 'bg-blue-50',  label: 'Update' },
  delete:  { icon: Trash2,     color: 'text-red-500',   bg: 'bg-red-50',   label: 'Delete' },
  auth:    { icon: LogIn,      color: 'text-purple-600',bg: 'bg-purple-50',label: 'Auth' },
  export:  { icon: FileDown,   color: 'text-orange-600',bg: 'bg-orange-50',label: 'Export' },
  approve: { icon: PlusCircle, color: 'text-teal-600',  bg: 'bg-teal-50',  label: 'Approve' },
  mpesa:   { icon: Smartphone, color: 'text-green-700', bg: 'bg-green-50', label: 'M-Pesa' },
}

export default function AuditLogs() {
  const { logs } = useFinance()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = !search ||
        l.user.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase())
      const matchesType = !typeFilter || l.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [logs, search, typeFilter])

  const { page, setPage, totalPages, paginated, total, perPage } = usePagination(filtered, 10)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Audit Logs</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track all system actions for accountability and compliance</p>
      </div>

      <div className="card p-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <ClipboardList className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Logged Events</p>
          <p className="text-lg font-bold text-gray-900">{logs.length}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" className="input-field pl-9"
              placeholder="Search by user or action..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input-field sm:w-44" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Actions</option>
            {Object.entries(typeConfig).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-gray-50">
          {paginated.length === 0 && (
            <p className="text-center text-gray-400 py-10 text-sm">No audit log entries found</p>
          )}
          {paginated.map(log => {
            const cfg = typeConfig[log.type] || typeConfig.create
            const Icon = cfg.icon
            return (
              <div key={log.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50/50 transition-colors">
                <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
                  <Icon className={clsx('w-4 h-4', cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-gray-100">{log.action}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-gray-500">{log.user}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{formatRelativeTime ? formatRelativeTime(log.timestamp) : log.timestamp}</span>
                    {log.module && <><span className="text-gray-300">·</span><span className="text-xs text-gray-400">{log.module}</span></>}
                  </div>
                </div>
                <span className={clsx('badge flex-shrink-0', cfg.bg, cfg.color)}>{cfg.label}</span>
              </div>
            )
          })}
        </div>

        {total > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={total} perPage={perPage} />
        )}
      </div>
    </div>
  )
}
