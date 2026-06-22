import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CHURCH_NAME, CHURCH_TAGLINE, CHURCH_ADDRESS } from '../utils/mockData'
import {
  Church, Eye, EyeOff, Loader2, CheckCircle2,
  TrendingUp, TrendingDown, Wallet, Users, Shield, BarChart3,
  ArrowRight, Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const FEATURES = [
  { icon: TrendingUp,   label: 'Income Tracking',     desc: 'Record tithes, offerings & donations',  color: '#34d399' },
  { icon: TrendingDown, label: 'Expense Management',  desc: 'Monitor and approve expenditures',       color: '#f87171' },
  { icon: Wallet,       label: 'Fund Accounts',        desc: 'Manage multiple designated funds',       color: '#60a5fa' },
  { icon: Users,        label: 'Member Contributions', desc: 'Track individual giving history',        color: '#a78bfa' },
  { icon: BarChart3,    label: 'Reports & Analytics',  desc: 'Generate financial reports instantly',   color: '#fbbf24' },
  { icon: Shield,       label: 'Audit Logs',           desc: 'Full accountability trail',              color: '#f472b6' },
]

const STATS = [
  { value: '100%', label: 'Transparent',    color: '#34d399' },
  { value: 'Live',  label: 'Real-time Data', color: '#60a5fa' },
  { value: 'Multi', label: 'Branch Support', color: '#a78bfa' },
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
      setTimeout(() => navigate(location.state?.from?.pathname || '/dashboard', { replace: true }), 800)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden">

      {/* ══════════════════════════════════════════════════════
          LEFT PANEL
      ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[58%] xl:w-[62%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0d0b2b 0%, #1a1550 35%, #0f2044 65%, #0b1a30 100%)' }}>

        {/* Animated ambient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-[80px] animate-orb-1"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
          <div className="absolute bottom-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full opacity-15 blur-[80px] animate-orb-2"
            style={{ background: 'radial-gradient(circle, #1d4ed8, transparent 70%)' }} />
          <div className="absolute top-[45%] left-[50%] w-[300px] h-[300px] rounded-full opacity-10 blur-[60px] animate-orb-3"
            style={{ background: 'radial-gradient(circle, #db2777, transparent 70%)' }} />
        </div>

        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 flex flex-col h-full px-12 xl:px-16 py-10">

          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-slide-up">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f5c842, #e9b828)', boxShadow: '0 8px 32px rgba(245,200,66,0.35)' }}>
              <Church className="w-6 h-6 text-yellow-900" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">{CHURCH_NAME}</div>
              <div className="text-white/40 text-xs">{CHURCH_TAGLINE}</div>
            </div>
          </div>

          {/* Hero text */}
          <div className="mt-16 xl:mt-20 animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-white/10"
              style={{ background: 'rgba(245,200,66,0.08)' }}>
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span className="text-gold-400 text-xs font-semibold uppercase tracking-widest">Financial Management</span>
            </div>
            <h1 className="text-4xl xl:text-[52px] font-black text-white leading-[1.1] tracking-tight">
              Steward Every<br />
              <span style={{
                background: 'linear-gradient(90deg, #f5c842, #f97316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Shilling</span>{' '}
              <span className="text-white">Well</span>
            </h1>
            <p className="text-white/50 mt-5 text-base leading-relaxed max-w-[420px]">
              A complete financial oversight platform built for churches — track income, manage expenses, and generate reports with confidence.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-10 flex gap-8 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
            {STATS.map(s => (
              <div key={s.label} className="group">
                <div className="text-2xl xl:text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-white/40 text-xs mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature grid */}
          <div className="mt-10 grid grid-cols-2 gap-2.5 animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.label}
                  className="group flex items-start gap-3 rounded-xl p-3.5 transition-all duration-200 cursor-default hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 group-hover:scale-110"
                    style={{ background: f.color + '20', border: `1px solid ${f.color}30` }}>
                    <Icon className="w-4 h-4" style={{ color: f.color }} />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{f.label}</p>
                    <p className="text-white/35 text-xs mt-0.5 leading-snug">{f.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-auto pt-8 text-white/20 text-xs">
            © {new Date().getFullYear()} {CHURCH_NAME} · {CHURCH_ADDRESS}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          RIGHT PANEL
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-5 py-10"
        style={{ background: 'linear-gradient(160deg, #f8faff 0%, #eef2ff 50%, #f3f0ff 100%)' }}>

        {/* Subtle background accent */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #c7d2fe, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #ddd6fe, transparent 70%)' }} />

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #f5c842, #e9b828)' }}>
            <Church className="w-5 h-5 text-yellow-900" />
          </div>
          <div>
            <div className="font-bold text-gray-900 text-base leading-tight">{CHURCH_NAME}</div>
            <div className="text-gray-400 text-xs">{CHURCH_TAGLINE}</div>
          </div>
        </div>

        {/* Form card */}
        <div className="relative z-10 w-full max-w-[420px] animate-login-rise">
          <div className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 32px 80px rgba(99,102,241,0.12), 0 8px 24px rgba(0,0,0,0.06)' }}>

            {/* Card top band */}
            <div className="relative overflow-hidden px-8 py-6"
              style={{ background: 'linear-gradient(135deg, #1c1c52, #2d2888)' }}>
              {/* Orb accent inside band */}
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-xl"
                style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #f5c842, #e9b828)' }}>
                  <Church className="w-5 h-5 text-yellow-900" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">{CHURCH_NAME}</p>
                  <p className="text-white/50 text-xs">{CHURCH_TAGLINE}</p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <div className="px-8 pt-7 pb-8">
              <div className="mb-7">
                <h2 className="text-2xl font-black text-gray-900">Sign In</h2>
                <p className="text-sm text-gray-400 mt-1">Enter your credentials to access the system</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                    className="w-full rounded-xl px-4 py-3 text-sm text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
                    style={{ background: '#f1f5ff', border: '1.5px solid #e0e7ff' }}
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="login-password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full rounded-xl px-4 py-3 pr-12 text-sm text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-brand-500"
                      style={{ background: '#f1f5ff', border: '1.5px solid #e0e7ff' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
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
                    'w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 transition-all duration-200',
                    success
                      ? 'bg-green-500 scale-[0.99]'
                      : 'hover:brightness-110 hover:shadow-lg active:scale-[0.98]',
                    (loading || success) && 'cursor-not-allowed opacity-90',
                  )}
                  style={!success ? {
                    background: 'linear-gradient(135deg, #4f4fe8, #6d28d9)',
                    boxShadow: '0 4px 20px rgba(79,79,232,0.4)',
                  } : {}}
                >
                  {success ? (
                    <><CheckCircle2 className="w-4 h-4" /> Signed in successfully</>
                  ) : loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                  ) : (
                    <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              {/* Security note */}
              <div className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                <Shield className="w-3.5 h-3.5 text-brand-400" />
                <p className="text-xs text-gray-400">Secured with role-based access control</p>
              </div>

              <p className="mt-5 text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand-600 font-bold hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400/70 mt-5">
            © {new Date().getFullYear()} {CHURCH_NAME} · {CHURCH_ADDRESS}
          </p>
        </div>
      </div>

    </div>
  )
}
