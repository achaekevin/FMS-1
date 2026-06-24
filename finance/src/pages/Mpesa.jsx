import { useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import StkPushModal from '../components/mpesa/StkPushModal'
import { formatCurrency } from '../utils/mockData'
import { Smartphone, Plus, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const statusConfig = {
  completed: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Completed' },
  pending:   { icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
  failed:    { icon: XCircle,      color: 'text-red-500',   bg: 'bg-red-50',   label: 'Failed' },
}

export default function MpesaPage() {
  const { mpesa, initiateMpesa } = useFinance()
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)

  const completed = mpesa.filter(t => t.status === 'completed').length
  const pending = mpesa.filter(t => t.status === 'pending').length
  const totalAmount = mpesa.filter(t => t.status === 'completed').reduce((s, t) => s + Number(t.amount), 0)

  const handleInitiate = async (data) => {
    initiateMpesa(data, user)
    toast.success(`STK Push sent to ${data.phone}. Awaiting confirmation...`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">M-Pesa Payments</h1>
          <p className="text-sm text-gray-400 mt-0.5">Initiate and track mobile money contributions</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Initiate STK Push
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Completed Payments</p>
            <p className="text-lg font-bold text-gray-900">{completed}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-lg font-bold text-gray-900">{pending}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total Received</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="section-title mb-0">Transaction History</h3>
          <button className="text-xs text-brand-600 font-medium flex items-center gap-1 hover:underline">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Date</th>
                <th className="table-header">Name</th>
                <th className="table-header hidden md:table-cell">Phone</th>
                <th className="table-header hidden lg:table-cell">Reference</th>
                <th className="table-header">Status</th>
                <th className="table-header text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {mpesa.length === 0 && (
                <tr><td colSpan={6} className="table-cell text-center text-gray-400 py-8">No M-Pesa transactions yet</td></tr>
              )}
              {mpesa.map(tx => {
                const cfg = statusConfig[tx.status] || statusConfig.pending
                const StatusIcon = cfg.icon
                return (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="table-cell text-xs text-gray-400">{tx.timestamp?.split(',')[0] || tx.timestamp}</td>
                    <td className="table-cell font-medium text-gray-800">{tx.name}</td>
                    <td className="table-cell hidden md:table-cell text-gray-500">{tx.phone}</td>
                    <td className="table-cell hidden lg:table-cell text-gray-400 font-mono text-xs">{tx.reference}</td>
                    <td className="table-cell">
                      <span className={clsx('badge gap-1', cfg.bg, cfg.color)}>
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                    <td className="table-cell text-right font-semibold text-gray-800">{formatCurrency(tx.amount)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <StkPushModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleInitiate} />
    </div>
  )
}
