import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CHURCH_NAME, CHURCH_TAGLINE, CHURCH_ADDRESS } from '../utils/mockData'
import {
  Church, Eye, EyeOff, Loader2, CheckCircle2,
  Shield, UserPlus, Users, Wallet, BarChart3, Lock,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ROLES = [
  { value: 'administrator', label: 'Administrator',
    desc: 'Full system access — manage users, approve all transactions' },
  { value: 'treasurer',     label: 'Treasurer',
    desc: 'Record income & expenses, generate reports, manage M-Pesa' },
  { value: 'pastor',        label: 'Pastor',
    desc: 'View financials, approve expense requests' },
]

const HIGHLIGHTS = [
  { icon: Users,    text: 'Member contribution tracking' },
  { icon: Wallet,   text: 'Multi-fund account management' },
  { icon: BarChart3, text: 'Real-time financial reports' },
  { icon: Lock,     text: 'Role-based access control' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'treasurer',
  })
  const [showPassword, setShowPassword]         = useState(false)
  const [showConfirm,  setShowConfirm]           = useState(false)
  const [loading,  setLoading]   = useState(false)
  const [success,  setSuccess]   = useState(false)
  const [shake,    setShake]     = useState(false)
  const [errors,   setErrors]    = useState({})

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  // ── Client-side validation ───────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.name.trim())          e.name     = 'Full name is required'
    if (!form.email.trim())         e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (form.password.length < 6)   e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) { setShake(true); setTimeout(() => setShake(false), 500); return }
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role })
      toast.success('Account created! Welcome 🎉')
      setSuccess(true)
      setTimeout(() => navigate('/dashboard', { replace: true }), 800)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed'
      toast.error(msg)
      setShake(true); setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex overflow-hidden">

      {/* ── LEFT PANEL ────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative flex-col bg-brand-950 overflow-hidden">

        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-orb-1 absolute -top-32 -left-32 w-96 h-96 bg-brand-700/40 rounded-full blur-3xl" />
          <div className="animate-orb-2 absolute top-1/2 -right-24 w-80 h-80 bg-gold-500/15 rounded-full blur-3xl" />
          <div className="animate-orb-3 absolute -bottom-32 left-1/3 w-96 h-96 bg-brand-600/30 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

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

          {/* Hero */}
          <div className="mt-16 xl:mt-20 animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
            <p className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">Get Started</p>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Join the<br />
              <span className="text-gold-400">Stewardship</span><br />
              Platform
            </h1>
            <p className="text-brand-300 mt-4 text-base leading-relaxed max-w-md">
              Create your account and start managing church finances with transparency and accountability.
            </p>
          </div>

          {/* Feature list */}
          <div className="mt-10 space-y-3 animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
            {HIGHLIGHTS.map(h => {
              const Icon = h.icon
              return (
                <div key={h.text} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-800 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-brand-300" />
                  </div>
                  <p className="text-white text-sm">{h.text}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-auto pt-8 text-brand-500 text-xs animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
            © {new Date().getFullYear()} {CHURCH_NAME} · {CHURCH_ADDRESS}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-gray-50 relative overflow-hidden">

        {/* Mobile background */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800" />
        <div className="lg:hidden absolute inset-0 pointer-events-none">
          <div className="animate-orb-1 absolute -top-20 -left-20 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="animate-orb-2 absolute top-1/3 -right-16 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl" />
        </div>

        {/* Mobile logo */}
        <div className="lg:hidden relative z-10 flex items-center justify-center pt-10 pb-4">
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

        {/* Form */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-10 lg:px-14 xl:px-20 py-6">
          <div className={clsx('w-full max-w-md animate-login-rise', shake && 'animate-shake')}>
            <div className="bg-white lg:shadow-xl rounded-2xl lg:rounded-3xl overflow-hidden">

              {/* Card header — desktop */}
              <div className="hidden lg:block bg-brand-950 px-8 py-5">
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

              {/* Form body */}
              <div className="px-7 sm:px-8 pt-7 pb-8">
                <div className="mb-6 animate-fade-slide-up" style={{ animationDelay: '150ms' }}>
                  <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                  <p className="text-sm text-gray-400 mt-1">Fill in your details to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                  {/* Full Name */}
                  <div className="animate-fade-slide-up" style={{ animationDelay: '180ms' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      className={clsx(
                        'w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white',
                        errors.name ? 'border-red-400' : 'border-gray-200'
                      )}
                      placeholder="John Kamau"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      autoComplete="name"
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div className="animate-fade-slide-up" style={{ animationDelay: '210ms' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      className={clsx(
                        'w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white',
                        errors.email ? 'border-red-400' : 'border-gray-200'
                      )}
                      placeholder="you@gracelife.org"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      autoComplete="email"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  {/* Role */}
                  <div className="animate-fade-slide-up" style={{ animationDelay: '230ms' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <div className="space-y-2">
                      {ROLES.map(r => (
                        <label key={r.value}
                          className={clsx(
                            'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                            form.role === r.value
                              ? 'border-brand-400 bg-brand-50'
                              : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
                          )}>
                          <input type="radio" name="role" value={r.value}
                            checked={form.role === r.value}
                            onChange={() => set('role', r.value)}
                            className="mt-0.5 accent-brand-600 flex-shrink-0" />
                          <div>
                            <p className={clsx('text-sm font-semibold leading-tight',
                              form.role === r.value ? 'text-brand-700' : 'text-gray-800')}>
                              {r.label}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="animate-fade-slide-up" style={{ animationDelay: '260ms' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={clsx(
                          'w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white',
                          errors.password ? 'border-red-400' : 'border-gray-200'
                        )}
                        placeholder="Min 6 characters"
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="animate-fade-slide-up" style={{ animationDelay: '280ms' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        className={clsx(
                          'w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all bg-gray-50 hover:bg-white focus:bg-white',
                          errors.confirmPassword ? 'border-red-400' : 'border-gray-200'
                        )}
                        placeholder="Repeat your password"
                        value={form.confirmPassword}
                        onChange={e => set('confirmPassword', e.target.value)}
                        autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </div>

                  {/* Submit */}
                  <div className="pt-1 animate-fade-slide-up" style={{ animationDelay: '310ms' }}>
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
                      {!loading && !success && <span className="absolute inset-0 animate-shimmer" />}
                      <span className="relative flex items-center gap-2">
                        {success ? (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Account created!
                          </span>
                        ) : loading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                        ) : (
                          <><UserPlus className="w-4 h-4" /> Create Account</>
                        )}
                      </span>
                    </button>
                  </div>
                </form>

                {/* Sign in link */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-2 justify-center">
                    <Shield className="w-3.5 h-3.5 text-gray-300" />
                    <p className="text-xs text-gray-400">Secured with role-based access control</p>
                  </div>
                  <p className="text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700 hover:underline transition-colors">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile footer */}
            <p className="lg:hidden text-center text-brand-400 text-xs mt-5">
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
