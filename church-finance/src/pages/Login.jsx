import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CHURCH_NAME, CHURCH_TAGLINE, CHURCH_ADDRESS } from '../utils/mockData'
import {
  Church, Eye, EyeOff, Loader2, CheckCircle2,
  TrendingUp, TrendingDown, Wallet, Users, Shield, BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const FEATURES = [
  { icon: TrendingUp,  label: 'Income Tracking',     desc: 'Record tithes, offerings & donations' },
  { icon: TrendingDown,label: 'Expense Management',  desc: 'Monitor and approve expenditures' },
  { icon: Wallet,      label: 'Fund Accounts',        desc: 'Manage multiple designated funds' },
  { icon: Users,       label: 'Member Contributions', desc: 'Track individual giving history' },
  { icon: BarChart3,   label: 'Reports & Analytics',  desc: 'Generate financial reports instantly' },
  { icon: Shield,      label: 'Audit Logs',           desc: 'Full accountability trail' },
]

const STATS = [
  { value: '100%',  label: 'Transparent' },
  { value: 'Live',  label: 'Real-time Data' },
  { value: 'Multi', label: 'Branch Support' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      setSuccess(true)
      setTimeout(() => {
        navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
      }, 700)
    } catch (err) {
      toast.error(err.message)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex overflow-hidden">

      {/* ── LEFT PANEL (hidden on mobile) ─────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] relative flex-col bg-brand-950 overflow-hidden">

        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-orb-1 absolute -top-32 -left-32 w-96 h-96 bg-brand-700/40 rounded-full blur-3xl" />
          <div className="animate-orb-2 absolute top-1/2 -right-24 w-80 h-80 bg-gold-500/15 rounded-full blur-3xl" />
          <div className="animate-orb-3 absolute -bottom-32 left-1/3 w-96 h-96 bg-brand-600/30 rounded-full blur-3xl" />
        </div>

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }} />

        {/* Content */}
        <div className="relative flex flex-col h-full px-12 xl:px-16 py-10">

          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-slide-up">
            <div className="w-11 h-11 bg-gold-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Church className="w-6 h-6 text-brand-950" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">{CHURCH_NAME}</div>
              <div className="text-brand-300 text-xs">{CHURCH_TAGLINE}</div>
            </div>
          </div>

          {/* Hero text */}
          <div className="mt-16 xl:mt-20 animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
            <p className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">Financial Management</p>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Steward Every<br />
              <span className="text-gold-400">Shilling</span> Well
            </h1>
            <p className="text-brand-300 mt-4 text-base leading-relaxed max-w-md">
              A complete financial oversight platform built for churches — track income, manage expenses, and generate reports with confidence.
            </p>
          </div>

          {/* Stats strip */}
          <div className="mt-10 flex gap-8 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-brand-400 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature grid */}
          <div className="mt-10 grid grid-cols-2 gap-3 animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.label} className="flex items-start gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3.5">
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

          {/* Footer */}
          <div className="mt-auto pt-8 text-brand-500 text-xs animate-fade-slide-up" style={{ animationDelay: '400ms' }}>
            © {new Date().getFullYear()} {CHURCH_NAME} · {CHURCH_ADDRESS}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ─────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-gray-50 relative overflow-hidden">

        {/* Mobile background — only visible on small screens */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 animate-gradient-shift" />
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <div className="animate-orb-1 absolute -top-20 -left-20 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="animate-orb-2 absolute top-1/3 -right-16 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
        </div>

        {/* Mobile logo bar */}
        <div className="lg:hidden relative z-10 flex items-center justify-center pt-10 pb-6">
          <div className="flex items-center gap-3 animate-fade-slide-up">
            <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center shadow-lg">
              <Church className="w-5 h-5 text-brand-950" />
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight">{CHURCH_NAME}</div>
              <div className="text-brand-300 text-xs">{CHURCH_TAGLINE}</div>
            </div>
          </div>
        </div>

        {/* Form area — centered */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-10 lg:px-14 xl:px-20 py-8">
          <div className={clsx('w-full max-w-md animate-login-rise', shake && 'animate-shake')}>

            {/* Desktop: plain white card */}
            <div className="bg-white lg:shadow-xl rounded-2xl lg:rounded-3xl overflow-hidden">

              {/* Card header — desktop only */}
              <div className="hidden lg:block bg-brand-950 px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center animate-logo-pop shadow-md flex-shrink-0">
                    <Church className="w-5 h-5 text-brand-950" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight">{CHURCH_NAME}</p>
                    <p className="text-brand-300 text-xs">{CHURCH_TAGLINE}</p>
                  </div>
                </div>
              </div>

              {/* Form body */}
              <div className="px-7 sm:px-8 pt-7 pb-8 lg:pt-8">
                <div className="mb-7 animate-fade-slide-up" style={{ animationDelay: '150ms' }}>
                  <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                  <p className="text-sm text-gray-400 mt-1">Enter your credentials to access the system</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div className="animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                      placeholder="you@gracelife.org"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      required
                      autoComplete="email"
                    />
                  </div>

                  {/* Password */}
                  <div className="animate-fade-slide-up" style={{ animationDelay: '250ms' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-1 animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
                    <button
                      type="submit"
                      disabled={loading || success}
                      className={clsx(
                        'relative w-full overflow-hidden text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm',
                        success
                          ? 'bg-green-500'
                          : 'bg-brand-600 hover:bg-brand-700 active:scale-[0.98] shadow-md shadow-brand-500/30 hover:shadow-lg hover:shadow-brand-500/40',
                        'disabled:opacity-80'
                      )}
                    >
                      {!loading && !success && (
                        <span className="absolute inset-0 animate-shimmer" />
                      )}
                      <span className="relative flex items-center gap-2">
                        {success ? (
                          <span className="animate-success-ping flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Signed in successfully
                          </span>
                        ) : loading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                        ) : (
                          'Sign In'
                        )}
                      </span>
                    </button>
                  </div>
                </form>

                {/* Security note */}
                <div className="mt-6 flex items-center gap-2 justify-center animate-fade-slide-up" style={{ animationDelay: '380ms' }}>
                  <Shield className="w-3.5 h-3.5 text-gray-300" />
                  <p className="text-xs text-gray-400">Secured with role-based access control</p>
                </div>
              </div>
            </div>

            {/* Mobile footer */}
            <p className="lg:hidden text-center text-brand-400 text-xs mt-5 animate-fade-slide-up" style={{ animationDelay: '420ms' }}>
              © {new Date().getFullYear()} {CHURCH_NAME} · {CHURCH_ADDRESS}
            </p>
          </div>
        </div>

        {/* Desktop bottom bar */}
        <div className="hidden lg:flex items-center justify-between px-14 xl:px-20 py-4 border-t border-gray-100 text-xs text-gray-400 flex-shrink-0">
          <span>{CHURCH_NAME} · {CHURCH_ADDRESS}</span>
          <span>© {new Date().getFullYear()} · All rights reserved</span>
        </div>
      </div>

    </div>
  )
}
