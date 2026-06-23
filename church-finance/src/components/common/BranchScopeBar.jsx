/**
 * BranchScopeBar
 * Displayed at the top of every page when branchMeta is available.
 * - Treasurer: shows their branch name + a locked badge
 * - Admin/Pastor: shows "All Branches" + a dropdown to filter by branch
 */
import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../utils/api'
import { GitBranch, Globe, ChevronDown, Lock } from 'lucide-react'
import clsx from 'clsx'

export default function BranchScopeBar({ branchMeta, onBranchChange }) {
  const { user } = useAuth()
  const [branches, setBranches] = useState([])
  const [selected, setSelected] = useState('all')
  const [open, setOpen]         = useState(false)

  const isGlobal = ['administrator', 'pastor'].includes(user?.role)

  useEffect(() => {
    if (!isGlobal) return
    api.get('/branches').then(r => setBranches(r.data.data || [])).catch(() => {})
  }, [isGlobal])

  const handleSelect = (branchId) => {
    setSelected(branchId)
    setOpen(false)
    onBranchChange?.(branchId === 'all' ? null : branchId)
  }

  const selectedBranch = branches.find(b => String(b.id) === String(selected))
  const label = selected === 'all'
    ? 'All Branches'
    : selectedBranch?.name || branchMeta?.branchName || 'All Branches'

  if (!branchMeta && !isGlobal) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border
      bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-700">

      {isGlobal ? (
        <>
          <Globe className="w-4 h-4 text-brand-500 flex-shrink-0" />
          <span className="text-brand-700 dark:text-brand-300 font-medium hidden sm:inline">Viewing:</span>
          {/* Branch dropdown */}
          <div className="relative">
            <button
              onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold text-brand-700 dark:text-brand-200
                bg-white dark:bg-brand-800/40 border border-brand-200 dark:border-brand-600 hover:bg-brand-100 dark:hover:bg-brand-800/60 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5" />
              {label}
              <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl
                shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50">
                <button
                  onClick={() => handleSelect('all')}
                  className={clsx('w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                    selected === 'all' && 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold')}
                >
                  <Globe className="w-3.5 h-3.5 opacity-60" /> All Branches (Consolidated)
                </button>
                {branches.map(b => (
                  <button
                    key={b.id}
                    onClick={() => handleSelect(String(b.id))}
                    className={clsx('w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                      String(selected) === String(b.id) && 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 font-semibold')}
                  >
                    <GitBranch className="w-3.5 h-3.5 opacity-60" />
                    {b.name}
                    {b.isMain && <span className="ml-auto text-[10px] bg-gold-400/20 text-gold-600 dark:text-gold-400 px-1.5 rounded-full">Main</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-brand-500 dark:text-brand-400 text-xs hidden md:inline">
            — consolidated data from all branches
          </span>
        </>
      ) : (
        <>
          <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <GitBranch className="w-4 h-4 text-brand-500 flex-shrink-0" />
          <span className="font-semibold text-brand-700 dark:text-brand-200">
            {branchMeta?.branchName || 'Your Branch'}
          </span>
          <span className="text-xs text-brand-500 dark:text-brand-400 hidden sm:inline">
            — data scoped to your branch only
          </span>
        </>
      )}
    </div>
  )
}
