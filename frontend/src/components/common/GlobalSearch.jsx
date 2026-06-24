import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../../contexts/FinanceContext'
import { Search, Users, TrendingUp, TrendingDown, Smartphone, Calendar, X } from 'lucide-react'
import { formatCurrency, formatDate } from '../../utils/mockData'
import clsx from 'clsx'

const typeIcon = {
  member:  { icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', path: '/members' },
  income:  { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50', path: '/income' },
  expense: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', path: '/expenses' },
  mpesa:   { icon: Smartphone, color: 'text-green-700', bg: 'bg-green-50', path: '/mpesa' },
  event:   { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', path: '/events' },
}

export default function GlobalSearch({ onClose }) {
  const { members, income, expenses, mpesa, events } = useFinance()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const results = useMemo(() => {
    if (query.length < 2) return []
    const q = query.toLowerCase()
    const res = []

    members.filter(m =>
      m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.email.toLowerCase().includes(q)
    ).slice(0, 3).forEach(m => res.push({ type: 'member', label: m.name, sub: m.phone, id: m.id }))

    income.filter(i =>
      i.memberName.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    ).slice(0, 3).forEach(i => res.push({ type: 'income', label: i.memberName, sub: `${i.category} · ${formatCurrency(i.amount)} · ${formatDate(i.date)}`, id: i.id }))

    expenses.filter(e =>
      e.description?.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    ).slice(0, 3).forEach(e => res.push({ type: 'expense', label: e.category, sub: `${formatCurrency(e.amount)} · ${formatDate(e.date)}`, id: e.id }))

    mpesa.filter(t =>
      t.name?.toLowerCase().includes(q) || t.phone?.includes(q) || t.reference?.toLowerCase().includes(q)
    ).slice(0, 2).forEach(t => res.push({ type: 'mpesa', label: t.name, sub: `${t.phone} · ${formatCurrency(t.amount)}`, id: t.id }))

    events.filter(ev =>
      ev.title?.toLowerCase().includes(q) || ev.type?.toLowerCase().includes(q)
    ).slice(0, 2).forEach(ev => res.push({ type: 'event', label: ev.title, sub: ev.type, id: ev.id }))

    return res
  }, [query, members, income, expenses, mpesa, events])

  const handleSelect = (item) => {
    navigate(typeIcon[item.type].path)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-base bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400"
            placeholder="Search members, income, expenses, events..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {query.length >= 2 && (
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Search className="w-8 h-8 text-gray-200 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-400">No results for "{query}"</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((item, i) => {
                  const cfg = typeIcon[item.type]
                  const Icon = cfg.icon
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
                        <Icon className={clsx('w-4 h-4', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.label}</p>
                        <p className="text-xs text-gray-400 truncate">{item.sub}</p>
                      </div>
                      <span className="text-xs text-gray-300 dark:text-gray-600 capitalize flex-shrink-0">{item.type}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {query.length < 2 && (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-gray-400">Type at least 2 characters to search</p>
          </div>
        )}

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">↵</kbd> to select</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  )
}
