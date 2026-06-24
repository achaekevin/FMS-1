import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useFinance } from '../../contexts/FinanceContext'
import { Bell, CheckCheck, AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { formatRelativeTime } from '../../utils/mockData'
import clsx from 'clsx'

const typeConfig = {
  success: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
  error:   { icon: AlertCircle, color: 'text-red-500',   bg: 'bg-red-50 dark:bg-red-900/30' },
  info:    { icon: Info,        color: 'text-blue-600',  bg: 'bg-blue-50 dark:bg-blue-900/30' },
}

export default function NotificationDropdown({ onClose }) {
  const { notifications, unreadNotifications, markNotificationRead, markAllNotificationsRead } = useFinance()
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const recent = notifications.slice(0, 15)

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Notifications</span>
          {unreadNotifications > 0 && (
            <span className="bg-brand-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadNotifications}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadNotifications > 0 && (
            <button onClick={markAllNotificationsRead} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
        {recent.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Bell className="w-8 h-8 text-gray-200 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        )}
        {recent.map(n => {
          const cfg = typeConfig[n.type] || typeConfig.info
          const Icon = cfg.icon
          return (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={clsx(
                'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50',
                !n.read && 'bg-brand-50/40 dark:bg-brand-900/20'
              )}
            >
              <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', cfg.bg)}>
                <Icon className={clsx('w-4 h-4', cfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={clsx('text-xs leading-relaxed', n.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-100 font-medium')}>
                  {n.message}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{formatRelativeTime(n.timestamp)}</span>
                  {n.module && <span className="text-xs text-gray-300 dark:text-gray-600">· {n.module}</span>}
                </div>
              </div>
              {!n.read && <div className="w-2 h-2 bg-brand-500 rounded-full flex-shrink-0 mt-1.5" />}
            </div>
          )
        })}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2.5">
        <Link to="/notifications" onClick={onClose} className="text-xs text-brand-600 hover:underline font-medium">
          View all notifications →
        </Link>
      </div>
    </div>
  )
}
