import { useFinance } from '../contexts/FinanceContext'
import { Bell, CheckCheck, AlertCircle, CheckCircle2, Info, Trash2 } from 'lucide-react'
import { formatRelativeTime } from '../utils/mockData'
import clsx from 'clsx'

const typeConfig = {
  success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30', label: 'Success' },
  error:   { icon: AlertCircle,  color: 'text-red-500',   bg: 'bg-red-50 dark:bg-red-900/30',   label: 'Alert' },
  info:    { icon: Info,         color: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-900/30',  label: 'Info' },
}

export default function Notifications() {
  const { notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead } = useFinance()

  const grouped = notifications.reduce((acc, n) => {
    const date = new Date(n.timestamp).toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(n)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="text-sm text-gray-400 mt-0.5">System alerts, updates and activity notifications</p>
        </div>
        {unreadNotifications > 0 && (
          <button onClick={markAllNotificationsRead} className="btn-secondary">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: notifications.length, color: 'brand' },
          { label: 'Unread', count: unreadNotifications, color: 'red' },
          { label: 'Success', count: notifications.filter(n => n.type === 'success').length, color: 'green' },
          { label: 'Alerts', count: notifications.filter(n => n.type === 'error').length, color: 'orange' },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <p className={`text-xl font-bold text-${s.color}-600`}>{s.count}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No notifications yet</p>
          <p className="text-xs text-gray-300 mt-1">Notifications will appear here as you use the system</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{date}</h3>
              <div className="card overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
                {items.map(n => {
                  const cfg = typeConfig[n.type] || typeConfig.info
                  const Icon = cfg.icon
                  return (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={clsx(
                        'flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50',
                        !n.read && 'bg-brand-50/30 dark:bg-brand-900/10'
                      )}
                    >
                      <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
                        <Icon className={clsx('w-4.5 h-4.5 w-[18px] h-[18px]', cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={clsx('text-sm leading-relaxed', n.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100 font-medium')}>
                          {n.message}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">{formatRelativeTime(n.timestamp)}</span>
                          {n.module && (
                            <span className={clsx('badge text-xs', cfg.bg, cfg.color)}>{n.module}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!n.read && <div className="w-2 h-2 bg-brand-500 rounded-full" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
