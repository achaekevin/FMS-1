import clsx from 'clsx'
import useCountUp from '../../hooks/useCountUp'

export default function StatCard({
  title, value, subtitle, icon: Icon, color = 'blue', trend,
  numericValue, formatValue, delay = 0,
}) {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    gold: { bg: 'bg-yellow-50', icon: 'text-yellow-600', border: 'border-yellow-100' },
  }
  const c = colors[color] || colors.blue

  // If a numericValue + formatValue are supplied, animate the count-up.
  const animated = useCountUp(numericValue ?? 0)
  const displayValue = numericValue !== undefined && formatValue
    ? formatValue(animated)
    : value

  return (
    <div
      className={clsx('card p-5 border animate-card-rise hover-lift', c.border)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center stat-icon-pulse', c.bg)}>
          <Icon className={clsx('w-5 h-5', c.icon)} />
        </div>
        {trend !== undefined && (
          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full',
            trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          )}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 leading-tight mb-0.5">{displayValue}</div>
      <div className="text-sm font-medium text-gray-600">{title}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  )
}
