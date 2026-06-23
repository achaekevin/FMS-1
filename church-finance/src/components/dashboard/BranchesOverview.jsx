/**
 * BranchesOverview
 * Consolidated per-branch KPI table shown only to admin/pastor in the dashboard.
 */
import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { GitBranch, TrendingUp, TrendingDown, Users, RefreshCw } from 'lucide-react'
import clsx from 'clsx'

const fmt = (v) => 'KES ' + Number(v || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 })

export default function BranchesOverview() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/dashboard/branches-overview')
      .then(r => setData(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const totals = data.reduce(
    (acc, b) => ({ income: acc.income + b.income, expenses: acc.expenses + b.expenses, members: acc.members + b.members }),
    { income: 0, expenses: 0, members: 0 }
  )

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Branches Overview</h3>
          <span className="text-xs text-gray-400">— consolidated view</span>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
          <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">Loading branch data…</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Branch</th>
                  <th className="table-header text-right">
                    <span className="flex items-center justify-end gap-1"><TrendingUp className="w-3.5 h-3.5 text-green-500" /> Income</span>
                  </th>
                  <th className="table-header text-right">
                    <span className="flex items-center justify-end gap-1"><TrendingDown className="w-3.5 h-3.5 text-red-500" /> Expenses</span>
                  </th>
                  <th className="table-header text-right">Net Balance</th>
                  <th className="table-header text-right">
                    <span className="flex items-center justify-end gap-1"><Users className="w-3.5 h-3.5" /> Members</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr><td colSpan={5} className="table-cell text-center text-gray-400 py-6">No branch data found</td></tr>
                )}
                {data.map((b, i) => (
                  <tr key={b.id ?? 'global'} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className={clsx('w-2 h-2 rounded-full flex-shrink-0',
                          b.id === null ? 'bg-gray-400' : b.isMain ? 'bg-gold-400' : 'bg-brand-400')} />
                        <span className="font-medium text-gray-800 dark:text-gray-100">{b.name}</span>
                        {b.isMain && b.id !== null && (
                          <span className="text-[10px] bg-gold-400/20 text-gold-600 dark:text-gold-400 px-1.5 py-0.5 rounded-full font-semibold">Main</span>
                        )}
                      </div>
                      {b.location && <p className="text-xs text-gray-400 ml-4">{b.location}</p>}
                    </td>
                    <td className="table-cell text-right font-medium text-green-600 dark:text-green-400">{fmt(b.income)}</td>
                    <td className="table-cell text-right font-medium text-red-500">{fmt(b.expenses)}</td>
                    <td className={clsx('table-cell text-right font-bold',
                      b.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                      {b.net >= 0 ? '+' : ''}{fmt(b.net)}
                    </td>
                    <td className="table-cell text-right text-gray-600 dark:text-gray-300">{b.members.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>

              {/* Totals row */}
              {data.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-200 dark:border-gray-600">
                    <td className="table-cell font-bold text-gray-700 dark:text-gray-200">Total (All Branches)</td>
                    <td className="table-cell text-right font-bold text-green-600 dark:text-green-400">{fmt(totals.income)}</td>
                    <td className="table-cell text-right font-bold text-red-500">{fmt(totals.expenses)}</td>
                    <td className={clsx('table-cell text-right font-black text-base',
                      totals.income - totals.expenses >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                      {totals.income - totals.expenses >= 0 ? '+' : ''}{fmt(totals.income - totals.expenses)}
                    </td>
                    <td className="table-cell text-right font-bold text-gray-700 dark:text-gray-200">{totals.members.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  )
}
