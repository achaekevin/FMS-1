import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import StatCard from '../components/common/StatCard'
import BranchScopeBar from '../components/common/BranchScopeBar'
import BranchesOverview from '../components/dashboard/BranchesOverview'
import api from '../utils/api'
import {
  TrendingUp, TrendingDown, Wallet, Users, HandCoins, Gift,
  ArrowUpRight, ArrowDownRight, Inbox, BarChart3, Activity, Medal
} from 'lucide-react'
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/mockData'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg p-3 text-xs animate-fade-slide-up">
        <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
        {payload.map(p => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-500 dark:text-gray-400 capitalize">{p.name}:</span>
            <span className="font-medium dark:text-gray-200">KES {p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const EmptyChartState = ({ label }) => (
  <div className="h-[220px] flex flex-col items-center justify-center text-center animate-fade-slide-up">
    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-3">
      <BarChart3 className="w-5 h-5 text-gray-300 dark:text-gray-600" />
    </div>
    <p className="text-sm text-gray-400">{label}</p>
    <p className="text-xs text-gray-300 dark:text-gray-600 mt-0.5">Data will appear here once recorded</p>
  </div>
)

const COLORS = ['#4f4fe8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const { totalIncome, totalExpenses, netBalance, totalTithes, totalDonations, members, income, expenses, logs } = useFinance()
  const { user } = useAuth()

  // Branch scope — fetched from the real API stats endpoint
  const [branchMeta, setBranchMeta] = useState(null)
  const isGlobal = ['administrator', 'pastor'].includes(user?.role)

  useEffect(() => {
    api.get('/dashboard/stats').then(r => {
      setBranchMeta(r.data.data?.branchMeta || null)
    }).catch(() => {})
  }, [])

  // Build monthly data dynamically
  const monthlyData = useMemo(() => {
    const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const m = d.getMonth(); const y = d.getFullYear()
      const inc = income.filter(x => { const xd = new Date(x.date); return xd.getMonth() === m && xd.getFullYear() === y }).reduce((s, x) => s + Number(x.amount), 0)
      const exp = expenses.filter(x => { const xd = new Date(x.date); return xd.getMonth() === m && xd.getFullYear() === y }).reduce((s, x) => s + Number(x.amount), 0)
      return { month: monthLabels[m], income: inc, expenses: exp }
    })
  }, [income, expenses])

  // Contribution trends
  const contributionTrends = useMemo(() => {
    const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const m = d.getMonth(); const y = d.getFullYear()
      const inMonth = income.filter(x => { const xd = new Date(x.date); return xd.getMonth() === m && xd.getFullYear() === y })
      return {
        month: monthLabels[m],
        tithes: inMonth.filter(x => x.category === 'Tithe').reduce((s, x) => s + Number(x.amount), 0),
        offerings: inMonth.filter(x => x.category === 'Offering').reduce((s, x) => s + Number(x.amount), 0),
        donations: inMonth.filter(x => x.category === 'Donation').reduce((s, x) => s + Number(x.amount), 0),
      }
    })
  }, [income])

  // Top contributors
  const topContributors = useMemo(() => {
    const map = {}
    income.forEach(i => {
      if (!map[i.memberName]) map[i.memberName] = 0
      map[i.memberName] += Number(i.amount)
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, total]) => ({ name, total }))
  }, [income])

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const map = {}
    income.forEach(i => {
      if (!map[i.category]) map[i.category] = 0
      map[i.category] += Number(i.amount)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)
  }, [income])

  const recentTransactions = [
    ...income.slice(0, 5).map(i => ({ ...i, type: 'income' })),
    ...expenses.slice(0, 3).map(e => ({ ...e, type: 'expense', memberName: e.approvedBy })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)

  const recentActivity = logs.slice(0, 8)

  const hasMonthlyData = monthlyData.some(m => m.income > 0 || m.expenses > 0)
  const hasTrendData = contributionTrends.some(m => m.tithes > 0 || m.offerings > 0 || m.donations > 0)

  const fmtK = (v) => v >= 1000 ? `KES ${(v / 1000).toFixed(0)}K` : `KES ${Math.round(v)}`

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between animate-fade-slide-up">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Here's what's happening with Grace Life Church finances</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 rounded-lg px-3 py-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-dot-pulse" />
          System Active
        </div>
      </div>

      {/* Branch scope indicator */}
      {branchMeta && (
        <BranchScopeBar branchMeta={branchMeta} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="col-span-2 lg:col-span-1 xl:col-span-1">
          <StatCard title="Total Income" icon={TrendingUp} color="green" subtitle="All time" numericValue={totalIncome} formatValue={fmtK} delay={0} />
        </div>
        <div className="col-span-2 lg:col-span-1 xl:col-span-1">
          <StatCard title="Total Expenses" icon={TrendingDown} color="red" subtitle="All time" numericValue={totalExpenses} formatValue={fmtK} delay={60} />
        </div>
        <div className="col-span-2 lg:col-span-1 xl:col-span-1">
          <StatCard title="Net Balance" icon={Wallet} color="blue" subtitle="Available funds" numericValue={netBalance} formatValue={fmtK} delay={120} />
        </div>
        <div className="xl:col-span-1">
          <StatCard title="Members" icon={Users} color="purple" subtitle="Active members" numericValue={members.length} formatValue={(v) => Math.round(v)} delay={180} />
        </div>
        <div className="xl:col-span-1">
          <StatCard title="Total Tithes" icon={HandCoins} color="gold" subtitle="All time" numericValue={totalTithes} formatValue={fmtK} delay={240} />
        </div>
        <div className="xl:col-span-1">
          <StatCard title="Donations" icon={Gift} color="orange" subtitle="All time" numericValue={totalDonations} formatValue={fmtK} delay={300} />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Income vs Expenses */}
        <div className="card p-5 animate-card-rise" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="section-title mb-0">Monthly Income vs Expenses</h3>
              <p className="text-xs text-gray-400">Last 6 months</p>
            </div>
          </div>
          {!hasMonthlyData ? (
            <EmptyChartState label="No income or expense history yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f4fe8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f4fe8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="income" stroke="#4f4fe8" strokeWidth={2} fill="url(#incomeGrad)" name="Income" dot={false} animationDuration={1200} animationEasing="ease-out" />
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" name="Expenses" dot={false} animationDuration={1200} animationEasing="ease-out" animationBegin={150} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Contribution Trends */}
        <div className="card p-5 animate-card-rise" style={{ animationDelay: '180ms' }}>
          <div className="mb-5">
            <h3 className="section-title mb-0">Contribution Trends</h3>
            <p className="text-xs text-gray-400">Tithes, offerings & donations</p>
          </div>
          {!hasTrendData ? (
            <EmptyChartState label="No contribution trends yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={contributionTrends} barSize={8} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}K`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="tithes" fill="#4f4fe8" radius={[3, 3, 0, 0]} name="Tithes" animationDuration={900} animationEasing="ease-out" />
                <Bar dataKey="offerings" fill="#10b981" radius={[3, 3, 0, 0]} name="Offerings" animationDuration={900} animationEasing="ease-out" animationBegin={100} />
                <Bar dataKey="donations" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Donations" animationDuration={900} animationEasing="ease-out" animationBegin={200} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts row 2 — Top Contributors + Category Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Contributors */}
        <div className="card p-5 animate-card-rise" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="section-title mb-0">Top Contributors</h3>
              <p className="text-xs text-gray-400">By total amount given</p>
            </div>
            <Medal className="w-5 h-5 text-gold-500" />
          </div>
          {topContributors.length === 0 ? (
            <EmptyChartState label="No contribution data yet" />
          ) : (
            <div className="space-y-3">
              {topContributors.map((c, i) => {
                const maxVal = topContributors[0].total
                const pct = maxVal > 0 ? Math.round((c.total / maxVal) * 100) : 0
                const medals = ['🥇','🥈','🥉']
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-lg w-6 text-center">{medals[i] || `${i+1}.`}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{c.name}</span>
                        <span className="text-xs font-semibold text-brand-600 ml-2 flex-shrink-0">{formatCurrency(c.total)}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-brand-600 transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Income Category Breakdown */}
        <div className="card p-5 animate-card-rise" style={{ animationDelay: '220ms' }}>
          <div className="mb-4">
            <h3 className="section-title mb-0">Income by Category</h3>
            <p className="text-xs text-gray-400">Distribution of income sources</p>
          </div>
          {categoryData.length === 0 ? (
            <EmptyChartState label="No income categories yet" />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value" animationDuration={900}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 min-w-0 space-y-2">
                {categoryData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{c.name}</span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 flex-shrink-0">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions + Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="card overflow-hidden animate-card-rise xl:col-span-2" style={{ animationDelay: '240ms' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="section-title mb-0">Recent Transactions</h3>
            <Link to="/income" className="text-xs text-brand-600 font-medium hover:underline">View all →</Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 animate-fade-slide-up">
              <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500 font-medium">No transactions yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">Income and expense records will show up here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Date</th>
                    <th className="table-header">Description</th>
                    <th className="table-header hidden sm:table-cell">Category</th>
                    <th className="table-header text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx, i) => (
                    <tr key={`${tx.type}-${tx.id}-${i}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors animate-row-rise" style={{ animationDelay: `${i * 45}ms` }}>
                      <td className="table-cell text-gray-400 text-xs">{formatDate(tx.date)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
                            {tx.type === 'income' ? <ArrowUpRight className="w-3.5 h-3.5 text-green-600" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight truncate">{tx.memberName || tx.approvedBy}</p>
                            <p className="text-xs text-gray-400 truncate">{tx.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell hidden sm:table-cell">
                        <span className={`badge ${tx.type === 'income' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>{tx.category}</span>
                      </td>
                      <td className="table-cell text-right">
                        <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="card overflow-hidden animate-card-rise" style={{ animationDelay: '260ms' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="section-title mb-0">Recent Activity</h3>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Activity className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-80 overflow-y-auto">
              {recentActivity.map((log, i) => (
                <div key={log.id} className="px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors animate-row-rise" style={{ animationDelay: `${i * 30}ms` }}>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{log.action}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-gray-500">{log.user}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{formatRelativeTime(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Branches Overview — admin/pastor only */}
      {isGlobal && <BranchesOverview />}
    </div>
  )
}
