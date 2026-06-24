import Modal from '../common/Modal'
import { formatCurrency, formatDate } from '../../utils/mockData'
import { Phone, Mail, Calendar, TrendingUp } from 'lucide-react'

export default function MemberDetailModal({ isOpen, onClose, member, contributions }) {
  if (!member) return null

  const memberContributions = contributions
    .filter(c => c.memberName === member.name)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const total = memberContributions.reduce((s, c) => s + Number(c.amount), 0)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Member Contribution History" size="lg">
      <div className="space-y-5">
        {/* Member info card */}
        <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{member.name}</p>
              <p className="text-xs text-gray-400">Member since {formatDate(member.joinDate)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> {member.phone}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-3.5 h-3.5 text-gray-400" /> {member.email}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 border-green-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs text-gray-500">Total Contributed</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
          </div>
          <div className="card p-4 border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-gray-500">Total Transactions</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{memberContributions.length}</p>
          </div>
        </div>

        {/* History */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Contribution History</p>
          <div className="border border-gray-100 rounded-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-gray-50">
            {memberContributions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No contributions recorded yet</p>
            )}
            {memberContributions.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.category}</p>
                  <p className="text-xs text-gray-400">{formatDate(c.date)} · {c.paymentMethod}</p>
                </div>
                <span className="text-sm font-semibold text-green-600">+{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
