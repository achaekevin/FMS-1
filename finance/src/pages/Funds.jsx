import { useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { formatCurrency } from '../utils/mockData'
import { Wallet, Building2, HeartHandshake, Globe2, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

const fundIcons = {
  'General Fund': Wallet,
  'Building Fund': Building2,
  'Welfare Fund': HeartHandshake,
  'Mission Fund': Globe2,
}

const fundColors = {
  blue:   { bg: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100' },
  green:  { bg: 'bg-green-500',  light: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-100' },
  purple: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  orange: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
}

export default function Funds() {
  const { funds, income, expenses } = useFinance()
  const [selectedFund, setSelectedFund] = useState(funds[0]?.name)

  const totalBalance = funds.reduce((s, f) => s + f.balance, 0)

  const activeFund = funds.find(f => f.name === selectedFund)
  const fundIncome = income.filter(i => i.fund === selectedFund).slice(0, 6)
  const fundExpenses = expenses.filter(e => e.fund === selectedFund).slice(0, 6)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Fund Accounts</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track balances across all designated church funds</p>
      </div>

      {/* Overview */}
      <div className="card p-5 bg-gradient-to-br from-brand-950 to-brand-800 text-white border-none">
        <p className="text-brand-300 text-sm">Total Across All Funds</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
        <div className="flex gap-6 mt-4 flex-wrap">
          {funds.map(f => (
            <div key={f.id} className="text-sm">
              <p className="text-brand-300 text-xs">{f.name}</p>
              <p className="font-semibold">{formatCurrency(f.balance)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fund cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {funds.map(f => {
          const Icon = fundIcons[f.name] || Wallet
          const c = fundColors[f.color] || fundColors.blue
          const active = selectedFund === f.name
          return (
            <button
              key={f.id}
              onClick={() => setSelectedFund(f.name)}
              className={clsx(
                'card p-5 text-left transition-all border-2',
                active ? c.border + ' ring-2 ring-offset-0' : 'border-gray-100 hover:border-gray-200'
              )}
              style={active ? { boxShadow: `0 0 0 2px var(--tw-ring-color, transparent)` } : {}}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', c.light)}>
                  <Icon className={clsx('w-5 h-5', c.text)} />
                </div>
                <ChevronRight className={clsx('w-4 h-4 transition-transform', active ? 'rotate-90 ' + c.text : 'text-gray-300')} />
              </div>
              <p className="text-sm font-medium text-gray-500">{f.name}</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{formatCurrency(f.balance)}</p>
              <p className="text-xs text-gray-400 mt-1">{f.description}</p>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <ArrowUpRight className="w-3 h-3" /> {formatCurrency(f.totalIncome)}
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <ArrowDownRight className="w-3 h-3" /> {formatCurrency(f.totalExpenses)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Fund detail */}
      {activeFund && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="section-title mb-0">{activeFund.name} — Recent Income</h3>
              <span className="badge bg-green-50 text-green-700">+{formatCurrency(activeFund.totalIncome)}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {fundIncome.length === 0 && <p className="px-5 py-6 text-sm text-gray-400 text-center">No income records for this fund</p>}
              {fundIncome.map(i => (
                <div key={i.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{i.memberName}</p>
                    <p className="text-xs text-gray-400">{i.category} · {new Date(i.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">+{formatCurrency(i.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="section-title mb-0">{activeFund.name} — Recent Expenses</h3>
              <span className="badge bg-red-50 text-red-700">-{formatCurrency(activeFund.totalExpenses)}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {fundExpenses.length === 0 && <p className="px-5 py-6 text-sm text-gray-400 text-center">No expense records for this fund</p>}
              {fundExpenses.map(e => (
                <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{e.category}</p>
                    <p className="text-xs text-gray-400 max-w-[200px] truncate">{e.description}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-500">-{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
