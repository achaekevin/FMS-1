import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CHURCH_NAME, CHURCH_TAGLINE, CHURCH_ADDRESS } from '../utils/mockData'
import {
  Church, Eye, EyeOff, Loader2, CheckCircle2,
  TrendingUp, TrendingDown, Wallet, Users, Shield, BarChart3,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const FEATURES = [
  { icon: TrendingUp,   label: 'Income Tracking',     desc: 'Record tithes, offerings & donations' },
  { icon: TrendingDown, label: 'Expense Management',  desc: 'Monitor and approve expenditures' },
  { icon: Wallet,       label: 'Fund Accounts',        desc: 'Manage multiple designated funds' },
  { icon: Users,        label: 'Member Contributions', desc: 'Track individual giving history' },
  { icon: BarChart3,    label: 'Reports & Analytics',  desc: 'Generate financial reports instantly' },
  { icon: Shield,       label: 'Audit Logs',           desc: 'Full accountability trail' },
]

const STATS = [
  { value: '100%', label: 'Transparent'  },
  { value: 'Live', label: 'Real-time Data' },
  { value: 'Multi', label: 'Branch Support' },
]

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [success,      setSuccess]      = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      setSuccess(true)
      setTimeout(() => navigate(location.state?.from?.pathname || '/dashboard', { replace: true }), 700)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>

      {/* ── LEFT PANEL — purely decorative, no interaction ── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-col bg-brand-950">
        <div className="flex flex-col h-full px-12 xl:px-16 py-10">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gold-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Church className="w-6 h-6 text-brand-950" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">{CHURCH_NAME}</div>
              <div className="text-brand-300 text-xs">{CHURCH_TAGLINE}</div>
            </div>
          </div>

          {/* Hero */}
          <div className="mt-16 xl:mt-20">
            <p className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">Financial Management</p>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Steward Every<br />
              <span className="text-gold-400">Shilling</span> Well
            </h1>
            <p className="text-brand-300 mt-4 text-base leading-relaxed max-w-md">
              A complete financial oversight platform built for churches — track income, manage expenses, and generate reports with confidence.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-10 flex gap-8">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-brand-400 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature grid */}
          <div className="mt-10 grid grid-cols-2 gap-3">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.label} className="flex items-start gap-3 bg-white/5 rounded-xl p-3.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-brand-300" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium leading-tight">{f.label}</p>
                    <p className="text-brand-400 text-xs mt-0.5 leading-snug">{f.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-auto pt-8 text-brand-500 text-xs">
            © {new Date().getFullYear()} {CHURCH_NAME} · {CHURCH_ADDRESS}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form only, no absolute/fixed children ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-5 py-10">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-950 rounded-xl flex items-center justify-center shadow-lg">
            <Church className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="text-gray-900 dark:text-white font-bold text-base leading-tight">{CHURCH_NAME}</div>
            <div className="text-gray-500 text-xs">{CHURCH_TAGLINE}</div>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">

            {/* Card header */}
            <div className="hidden lg:block bg-brand-950 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <Church className="w-5 h-5 text-brand-950" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight">{CHURCH_NAME}</p>
                  <p className="text-brand-300 text-xs">{CHURCH_TAGLINE}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="px-7 sm:px-8 pt-7 pb-8">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sign In</h2>
                <p className="text-sm text-gray-400 mt-1">Enter your credentials to access the system</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline font-medium">
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 pr-11 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}
                      className="text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || success}
                  className={clsx(
                    'w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-colors',
                    success ? 'bg-green-500' : 'bg-brand-600 hover:bg-brand-700',
                    (loading || success) && 'opacity-80 cursor-not-allowed'
                  )}
                >
                  {success ? (
                    <><CheckCircle2 className="w-4 h-4" /> Signed in successfully</>
                  ) : loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2">
                <Shield className="w-3.5 h-3.5 text-gray-300" />
                <p className="text-xs text-gray-400">Secured with role-based access control</p>
              </div>

              <p className="mt-4 text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand-600 font-semibold hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            © {new Date().getFullYear()} {CHURCH_NAME} · {CHURCH_ADDRESS}
          </p>
        </div>
      </div>

    </div>
  )
}
