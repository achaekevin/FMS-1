import { useState, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { formatCurrency, formatDate } from '../utils/mockData'
import { exportIncomeReport, exportExpenseReport, exportMemberReport, exportToExcel } from '../utils/exportUtils'
import {
  FileText, TrendingUp, TrendingDown, Wallet, Users,
  FileDown, FileSpreadsheet, Calendar
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const REPORT_TYPES = [
  { id: 'income',        label: 'Income Report',              icon: TrendingUp,  color: 'green' },
  { id: 'expense',       label: 'Expense Report',              icon: TrendingDown, color: 'red' },
  { id: 'fund',          label: 'Fund Report',                  icon: Wallet,      color: 'blue' },
  { id: 'contribution',  label: 'Member Contribution Report',   icon: Users,       color: 'purple' },
]

const colorMap = {
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  ring: 'ring-green-500' },
  red:    { bg: 'bg-red-50',    text: 'text-red-500',    ring: 'ring-red-500' },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   ring: 'ring-blue-500' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', ring: 'ring-purple-500' },
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Reports() {
  const { income, expenses, funds, members } = useFinance()
  const [activeReport, setActiveReport] = useState('income')
  const [filterType, setFilterType] = useState('all') // all | range | month | year
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

  const inRange = (dateStr) => {
    const d = new Date(dateStr)
    if (filterType === 'range' && startDate && endDate) {
      return d >= new Date(startDate) && d <= new Date(endDate)
    }
    if (filterType === 'month') {
      return d.getMonth() === Number(month) && d.getFullYear() === Number(year)
    }
    if (filterType === 'year') {
      return d.getFullYear() === Number(year)
    }
    return true
  }

  const filteredIncome = useMemo(() => income.filter(i => inRange(i.date)), [income, filterType, startDate, endDate, month, year])
  const filteredExpenses = useMemo(() => expenses.filter(e => inRange(e.date)), [expenses, filterType, startDate, endDate, month, year])

  const totalIncome = filteredIncome.reduce((s, i) => s + Number(i.amount), 0)
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0)

  const memberContribTotals = useMemo(() => {
    return members.map(m => {
      const contributions = filteredIncome.filter(i => i.memberName === m.name)
      return { ...m, total: contributions.reduce((s, c) => s + Number(c.amount), 0), count: contributions.length }
    }).sort((a, b) => b.total - a.total)
  }, [members, filteredIncome])

  const handleExportPDF = () => {
    if (activeReport === 'income') exportIncomeReport(filteredIncome, 'Income Report')
    else if (activeReport === 'expense') exportExpenseReport(filteredExpenses, 'Expense Report')
    else if (activeReport === 'contribution') exportMemberReport(memberContribTotals.map(m => ({ ...m, totalContributions: m.total })))
    else if (activeReport === 'fund') {
      toast.error('Fund report PDF export — switch to Income/Expense/Contribution for PDF, or use Excel below')
      return
    }
    toast.success('PDF report downloaded')
  }

  const handleExportExcel = () => {
    if (activeReport === 'income') {
      exportToExcel(filteredIncome.map(i => ({ Date: formatDate(i.date), Member: i.memberName, Category: i.category, 'Amount (KES)': i.amount, Fund: i.fund })), 'income-report')
    } else if (activeReport === 'expense') {
      exportToExcel(filteredExpenses.map(e => ({ Date: formatDate(e.date), Category: e.category, 'Amount (KES)': e.amount, Fund: e.fund, 'Approved By': e.approvedBy })), 'expense-report')
    } else if (activeReport === 'fund') {
      exportToExcel(funds.map(f => ({ Fund: f.name, Balance: f.balance, 'Total Income': f.totalIncome, 'Total Expenses': f.totalExpenses })), 'fund-report')
    } else if (activeReport === 'contribution') {
      exportToExcel(memberContribTotals.map(m => ({ Name: m.name, Phone: m.phone, 'Total Contributions': m.total, Transactions: m.count })), 'member-contributions')
    }
    toast.success('Excel file downloaded')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">Generate and export financial reports</p>
      </div>

      {/* Report type tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {REPORT_TYPES.map(r => {
          const Icon = r.icon
          const c = colorMap[r.color]
          const active = activeReport === r.id
          return (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={clsx(
                'card p-4 text-left transition-all border-2',
                active ? 'border-brand-300 ring-2 ring-brand-100' : 'border-gray-100 hover:border-gray-200'
              )}
            >
              <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center mb-2', c.bg)}>
                <Icon className={clsx('w-4 h-4', c.text)} />
              </div>
              <p className="text-sm font-medium text-gray-800">{r.label}</p>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Filter Period</p>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'range', label: 'Date Range' },
            { id: 'month', label: 'By Month' },
            { id: 'year', label: 'By Year' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={clsx(
                'text-xs font-medium px-3 py-1.5 rounded-full transition-colors',
                filterType === f.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filterType === 'range' && (
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="label">Start Date</label>
              <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label">End Date</label>
              <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        )}
        {filterType === 'month' && (
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="label">Month</label>
              <select className="input-field" value={month} onChange={e => setMonth(e.target.value)}>
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Year</label>
              <input type="number" className="input-field w-28" value={year} onChange={e => setYear(e.target.value)} />
            </div>
          </div>
        )}
        {filterType === 'year' && (
          <div>
            <label className="label">Year</label>
            <input type="number" className="input-field w-28" value={year} onChange={e => setYear(e.target.value)} />
          </div>
        )}
      </div>

      {/* Report preview */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="section-title mb-0">{REPORT_TYPES.find(r => r.id === activeReport)?.label} Preview</h3>
          <div className="flex gap-2">
            <button onClick={handleExportPDF} className="btn-secondary">
              <FileDown className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={handleExportExcel} className="btn-secondary">
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {activeReport === 'income' && (
          <>
            <div className="px-5 py-3 bg-green-50/50 flex justify-between text-sm">
              <span className="text-gray-500">{filteredIncome.length} records</span>
              <span className="font-semibold text-green-600">Total: {formatCurrency(totalIncome)}</span>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="sticky top-0"><tr>
                  <th className="table-header">Date</th><th className="table-header">Member</th>
                  <th className="table-header">Category</th><th className="table-header text-right">Amount</th>
                </tr></thead>
                <tbody>
                  {filteredIncome.length === 0 && (
                    <tr><td colSpan={4} className="table-cell text-center text-gray-400 py-8">No income records for this period</td></tr>
                  )}
                  {filteredIncome.slice(0, 50).map(i => (
                    <tr key={i.id}><td className="table-cell text-xs text-gray-400">{formatDate(i.date)}</td>
                      <td className="table-cell">{i.memberName}</td><td className="table-cell">{i.category}</td>
                      <td className="table-cell text-right font-medium text-green-600">{formatCurrency(i.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeReport === 'expense' && (
          <>
            <div className="px-5 py-3 bg-red-50/50 flex justify-between text-sm">
              <span className="text-gray-500">{filteredExpenses.length} records</span>
              <span className="font-semibold text-red-500">Total: {formatCurrency(totalExpenses)}</span>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="sticky top-0"><tr>
                  <th className="table-header">Date</th><th className="table-header">Category</th>
                  <th className="table-header">Approved By</th><th className="table-header text-right">Amount</th>
                </tr></thead>
                <tbody>
                  {filteredExpenses.length === 0 && (
                    <tr><td colSpan={4} className="table-cell text-center text-gray-400 py-8">No expense records for this period</td></tr>
                  )}
                  {filteredExpenses.slice(0, 50).map(e => (
                    <tr key={e.id}><td className="table-cell text-xs text-gray-400">{formatDate(e.date)}</td>
                      <td className="table-cell">{e.category}</td><td className="table-cell">{e.approvedBy}</td>
                      <td className="table-cell text-right font-medium text-red-500">{formatCurrency(e.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeReport === 'fund' && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {funds.map(f => (
              <div key={f.id} className="border border-gray-100 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700">{f.name}</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(f.balance)}</p>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-green-600">+{formatCurrency(f.totalIncome)}</span>
                  <span className="text-red-500">-{formatCurrency(f.totalExpenses)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeReport === 'contribution' && (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="sticky top-0"><tr>
                <th className="table-header">Member</th><th className="table-header">Phone</th>
                <th className="table-header text-center">Transactions</th><th className="table-header text-right">Total</th>
              </tr></thead>
              <tbody>
                {memberContribTotals.length === 0 && (
                  <tr><td colSpan={4} className="table-cell text-center text-gray-400 py-8">No members to report on yet</td></tr>
                )}
                {memberContribTotals.map(m => (
                  <tr key={m.id}><td className="table-cell font-medium">{m.name}</td>
                    <td className="table-cell text-gray-500">{m.phone}</td>
                    <td className="table-cell text-center">{m.count}</td>
                    <td className="table-cell text-right font-medium text-gray-800">{formatCurrency(m.total)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
