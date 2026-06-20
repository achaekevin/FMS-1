import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Loader2, CheckCircle2, User, Mail, Shield, Key, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROLE_COLORS = {
  administrator: 'bg-gold-500/20 text-yellow-700 dark:text-yellow-300',
  treasurer:     'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  pastor:        'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
}

const ROLE_PERMISSIONS = {
  administrator: ['Full system access', 'Manage all users', 'Approve transactions', 'Backup & restore', 'All settings'],
  treasurer:     ['Record income & expenses', 'Generate reports', 'Manage M-Pesa', 'Payroll & assets', 'Communications'],
  pastor:        ['View financials', 'Approve expense requests', 'View members & reports', 'View events & attendance'],
}

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth()

  // Profile form
  const [profile,      setProfile]      = useState({ name: user?.name || '', email: user?.email || '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Password form
  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingPwd,   setSavingPwd]   = useState(false)
  const [pwdErrors,   setPwdErrors]   = useState({})

  const initials = (user?.name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  // ── Save profile ──────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!profile.name.trim()) { toast.error('Name is required'); return }
    setSavingProfile(true)
    try {
      await updateProfile({ name: profile.name.trim(), email: profile.email.trim() })
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Update failed')
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Change password ───────────────────────────────────────
  const validatePwd = () => {
    const e = {}
    if (!passwords.current)            e.current = 'Current password is required'
    if (passwords.newPwd.length < 6)   e.newPwd  = 'New password must be at least 6 characters'
    if (passwords.newPwd !== passwords.confirm) e.confirm = 'Passwords do not match'
    setPwdErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!validatePwd()) return
    setSavingPwd(true)
    try {
      await changePassword(passwords.current, passwords.newPwd)
      toast.success('Password changed successfully')
      setPasswords({ current: '', newPwd: '', confirm: '' })
      setPwdErrors({})
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password'
      toast.error(msg)
      if (msg.includes('Current') || msg.includes('current')) {
        setPwdErrors(p => ({ ...p, current: msg }))
      }
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account details and security settings</p>
      </div>

      {/* Avatar + role card */}
      <div className="card p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{user?.name}</h2>
          <p className="text-sm text-gray-400 mt-0.5 truncate">{user?.email}</p>
          <span className={clsx(
            'inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold capitalize',
            ROLE_COLORS[user?.role] || 'bg-gray-100 text-gray-600'
          )}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Role permissions */}
      <div className="card p-5">
        <h3 className="section-title flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-600" /> Your Permissions
        </h3>
        <ul className="space-y-2">
          {(ROLE_PERMISSIONS[user?.role] || []).map(p => (
            <li key={p} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Edit profile */}
      <div className="card p-5">
        <h3 className="section-title flex items-center gap-2">
          <User className="w-4 h-4 text-brand-600" /> Edit Profile
        </h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            <input
              className="input-field"
              placeholder="Your full name"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email Address
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile} className="btn-primary disabled:opacity-60">
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-5">
        <h3 className="section-title flex items-center gap-2">
          <Key className="w-4 h-4 text-brand-600" /> Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">

          {/* Current password */}
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                className={clsx('input-field pr-10', pwdErrors.current && 'border-red-400')}
                placeholder="Your current password"
                value={passwords.current}
                onChange={e => { setPasswords(p => ({ ...p, current: e.target.value })); setPwdErrors(p => ({ ...p, current: '' })) }}
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwdErrors.current && <p className="text-xs text-red-500 mt-1">{pwdErrors.current}</p>}
          </div>

          {/* New password */}
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                className={clsx('input-field pr-10', pwdErrors.newPwd && 'border-red-400')}
                placeholder="Min 6 characters"
                value={passwords.newPwd}
                onChange={e => { setPasswords(p => ({ ...p, newPwd: e.target.value })); setPwdErrors(p => ({ ...p, newPwd: '' })) }}
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwdErrors.newPwd && <p className="text-xs text-red-500 mt-1">{pwdErrors.newPwd}</p>}
          </div>

          {/* Confirm password */}
          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={clsx('input-field pr-10', pwdErrors.confirm && 'border-red-400')}
                placeholder="Repeat new password"
                value={passwords.confirm}
                onChange={e => { setPasswords(p => ({ ...p, confirm: e.target.value })); setPwdErrors(p => ({ ...p, confirm: '' })) }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pwdErrors.confirm && <p className="text-xs text-red-500 mt-1">{pwdErrors.confirm}</p>}
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={savingPwd} className="btn-primary disabled:opacity-60">
              {savingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
