import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { FinanceProvider } from './contexts/FinanceContext'
import ProtectedRoute from './routes/ProtectedRoute'
import MainLayout from './layouts/MainLayout'

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Expenses from './pages/Expenses'
import Funds from './pages/Funds'
import Members from './pages/Members'
import Reports from './pages/Reports'
import MpesaPage from './pages/Mpesa'
import AuditLogs from './pages/AuditLogs'
import Budget from './pages/Budget'
import Events from './pages/Events'
import Assets from './pages/Assets'
import Payroll from './pages/Payroll'
import Branches from './pages/Branches'
import Announcements from './pages/Announcements'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Backup from './pages/Backup'
import Communication from './pages/Communication'
import Documents from './pages/Documents'
import Attendance from './pages/Attendance'
import Visitors from './pages/Visitors'
import PrayerRequests from './pages/PrayerRequests'
import PublicPrayerRequest from './pages/PublicPrayerRequest'

const Protected = ({ children }) => (
  <ProtectedRoute>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
)

function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <Toaster position="top-right" toastOptions={{
          style: { fontSize: '14px', borderRadius: '10px' },
          className: 'dark:bg-gray-800 dark:text-gray-100',
        }} />
        <Routes>
          <Route path="/login"           element={<Login />} />
          <Route path="/register"        element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />
          <Route path="/pray"            element={<PublicPrayerRequest />} />
          <Route path="/profile"         element={<Protected><Profile /></Protected>} />

          <Route path="/dashboard"     element={<Protected><Dashboard /></Protected>} />
          <Route path="/income"        element={<Protected><Income /></Protected>} />
          <Route path="/expenses"      element={<Protected><Expenses /></Protected>} />
          <Route path="/funds"         element={<Protected><Funds /></Protected>} />
          <Route path="/members"       element={<Protected><Members /></Protected>} />
          <Route path="/reports"       element={<Protected><Reports /></Protected>} />
          <Route path="/mpesa"         element={<Protected><MpesaPage /></Protected>} />
          <Route path="/audit"         element={<Protected><AuditLogs /></Protected>} />
          <Route path="/budget"        element={<Protected><Budget /></Protected>} />
          <Route path="/events"        element={<Protected><Events /></Protected>} />
          <Route path="/assets"        element={<Protected><Assets /></Protected>} />
          <Route path="/payroll"       element={<Protected><Payroll /></Protected>} />
          <Route path="/branches"      element={<Protected><Branches /></Protected>} />
          <Route path="/announcements" element={<Protected><Announcements /></Protected>} />
          <Route path="/notifications"   element={<Protected><Notifications /></Protected>} />
          <Route path="/communication"   element={<Protected><Communication /></Protected>} />
          <Route path="/documents"       element={<Protected><Documents /></Protected>} />
          <Route path="/attendance"      element={<Protected><Attendance /></Protected>} />
          <Route path="/visitors"       element={<Protected><Visitors /></Protected>} />
          <Route path="/prayer-requests" element={<Protected><PrayerRequests /></Protected>} />
          <Route path="/settings"        element={<Protected><Settings /></Protected>} />
          <Route path="/backup"          element={<Protected><Backup /></Protected>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </FinanceProvider>
    </AuthProvider>
  )
}

export default App
