import { useState, useEffect } from 'react'
import { Users, CheckCircle, Loader2, Church, AlertCircle } from 'lucide-react'
import api from '../utils/api'
import clsx from 'clsx'

const CHURCH = import.meta.env.VITE_CHURCH_NAME || 'Grace Life Church'

const emptyForm = {
  fullName: '', phone: '', email: '', gender: '',
  dateOfBirth: '', address: '',
}

export default function PublicMemberRegister() {
  const [step,    setStep]    = useState(1)   // 1=form, 2=success
  const [form,    setForm]    = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [member,  setMember]  = useState(null)
  const [branches, setBranches] = useState([])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Load branches for the branch selector
  useEffect(() => {
    api.get('/branches?status=active').then(r => setBranches(r.data.data || [])).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/members/self-register', {
        fullName:    form.fullName.trim(),
        phone:       form.phone.trim(),
        email:       form.email.trim()       || undefined,
        gender:      form.gender             || undefined,
        dateOfBirth: form.dateOfBirth        || undefined,
        address:     form.address.trim()     || undefined,
        branchId:    form.branchId           || undefined,
      })
      setMember(res.data.data)
      setStep(2)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false) }
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #1c1c52 0%, #2d2888 50%, #1c1c52 100%)' }}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #4f4fe8, #6d28d9)' }}>
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome! 🎉</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            <strong className="text-gray-800">{form.fullName}</strong>, your registration has been received.
            The church team will review and activate your account — you will receive an email confirmation shortly.
          </p>

          {/* Member ID card */}
          <div className="rounded-xl p-4 mb-6 text-left"
            style={{ background: 'linear-gradient(135deg, #1c1c52, #2d2888)' }}>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Member Details</p>
            <div className="space-y-1.5 text-sm">
              {[
                ['Full Name', form.fullName],
                ['Phone',     form.phone],
                ...(form.email ? [['Email', form.email]] : []),
                ['Member ID', `#${member?.id || '—'}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-white/50">{k}</span>
                  <span className="text-white font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700 mb-6">
            ⏳ Your registration is <strong>pending approval</strong>. The church office will review your details and activate your account. If you provided an email, you will receive a confirmation once approved.
          </div>

          <button
            onClick={() => { setStep(1); setForm(emptyForm); setMember(null) }}
            className="text-sm text-brand-600 hover:underline"
          >
            Register another member
          </button>

          <p className="mt-4 text-xs text-gray-400">
            © {new Date().getFullYear()} {CHURCH} · Nairobi, Kenya
          </p>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-8 px-4 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1c1c52 0%, #2d2888 50%, #1c1c52 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">

        {/* Header */}
        <div className="px-8 py-7 text-center"
          style={{ background: 'linear-gradient(135deg, #1c1c52, #2d2888)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'linear-gradient(135deg, #f5c842, #e9b828)' }}>
            <Church className="w-7 h-7 text-yellow-900" />
          </div>
          <h1 className="text-2xl font-black text-white">{CHURCH}</h1>
          <p className="text-white/50 text-sm mt-1">Member Self-Registration</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <p className="text-sm text-gray-500 text-center -mt-1">
            Fill in your details below to join our church family. It takes less than a minute.
          </p>

          {/* Error */}
          {error && (
            <div className="flex gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Full name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              placeholder="e.g. John Kamau Mwangi"
              value={form.fullName}
              onChange={e => set('fullName', e.target.value)}
              required
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              placeholder="07xx xxx xxx"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              required
            />
            <p className="text-xs text-gray-400 mt-1">Kenyan number starting with 07 or +254</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              placeholder="your@email.com (optional)"
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>

          {/* Gender + DOB */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                value={form.gender}
                onChange={e => set('gender', e.target.value)}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                value={form.dateOfBirth}
                onChange={e => set('dateOfBirth', e.target.value)}
                max={new Date().toISOString().slice(0,10)}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Home Address / Estate</label>
            <input
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              placeholder="e.g. Kisii Town, Nyanchwa Estate (optional)"
              value={form.address}
              onChange={e => set('address', e.target.value)}
            />
          </div>

          {/* Branch */}
          {branches.length > 1 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Which branch do you attend?</label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                value={form.branchId || ''}
                onChange={e => set('branchId', e.target.value)}
              >
                <option value="">Select branch (optional)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}{b.location ? ` — ${b.location}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70 mt-2"
            style={{ background: 'linear-gradient(135deg, #4f4fe8, #6d28d9)', boxShadow: '0 4px 20px rgba(79,79,232,0.35)' }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</>
              : <><Users className="w-4 h-4" /> Complete Registration</>}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Your information is kept private and used only for church administration.
          </p>
        </form>
      </div>
    </div>
  )
}
