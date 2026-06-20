import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

// Map of paths to the permission required to access them
const PATH_PERMISSIONS = {
  '/income':        'view_income',
  '/expenses':      'view_expense',
  '/funds':         'view_funds',
  '/members':       'view_members',
  '/mpesa':         'mpesa',
  '/budget':        'manage_budget',
  '/events':        'view_events',
  '/attendance':    'view_attendance',
  '/assets':        'manage_assets',
  '/payroll':       'manage_payroll',
  '/branches':      'manage_branches',
  '/announcements': 'manage_announcements',
  '/documents':     'manage_documents',
  '/reports':       'view_reports',
  '/audit':         'audit',
  '/communication': 'manage_communications',
  '/notifications': 'view_notifications',
  '/settings':      'manage_settings',
  '/backup':        'manage_backup',
}

const ProtectedRoute = ({ children, permission }) => {
  const { user, loading, can } = useAuth()
  const location = useLocation()

  // Determine required permission from path if not explicitly passed
  const required = permission || PATH_PERMISSIONS[location.pathname]

  const isDenied = user && required && !can(required)

  useEffect(() => {
    if (isDenied) {
      toast.error("You don't have permission to access that page.", { id: 'access-denied' })
    }
  }, [isDenied])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (isDenied) return <Navigate to="/dashboard" replace />

  return children
}

export default ProtectedRoute
