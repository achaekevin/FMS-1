import { useState } from 'react'
import { Heart, HandHeart, CheckCircle, ChevronDown } from 'lucide-react'
import api from '../utils/api'
import clsx from 'clsx'

const CATEGORIES = [
  { value: 'Healing',      label: '🙏 Healing',      desc: 'Physical or emotional healing' },
  { value: 'Family',       label: '👨‍👩‍👧 Family',       desc: 'Family relationships & unity' },
  { value: 'Employment',   label: '💼 Employment',   desc: 'Jobs, business & provision' },
  { value: 'Thanksgiving', label: '🌟 Thanksgiving', desc: 'Praise and gratitude to God' },
  { value: 'Other',        label: '❤️ Other',        desc: 'Any other prayer need' },
]

const CHURCH = import.meta.env.VITE_CHURCH_NAME || 'Grace Life Church'

export default function PublicPrayerRequest() {
  const [step, setStep] = useState(1) // 1 = form, 2 = success
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    requesterName: '',
    email: '',
    phone: '',
    category: '',
    title: '',
    description: '',
    isAnonymous: false,
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.category) { setError('Please select a prayer category'); return }
    if (!form.email && !form.phone) {
      setError('Please provide at least an email or phone number so we can notify you when your prayer is answered')
      return
    }

    setLoading(true)
    try {
      await api.post('/prayer-requests/public', {
        requesterName: form.requesterName,
        email:         form.email   || undefined,
        phone:         form.phone   || undefined,
        category:      form.category,
        title:         form.title,
        description:   form.description,
        isAnonymous:   form.isAnonymous,
        priority:      'Medium',
      })
      setStep(2)
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Prayer Request Submitted!</h2>
          <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
            Thank you, <strong>{form.isAnonymous ? 'friend' : form.requesterName}</strong>. Your prayer request has been received.
            Our pastors will be praying with you, and we will notify you when it is answered.
          </p>
          <div className="bg-brand-50 dark:bg-brand-900/20 rounded-xl p-4 mb-6 text-sm text-brand-700 dark:text-brand-300">
            <HandHeart className="w-5 h-5 mx-auto mb-2 text-brand-500" />
            <em>"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."</em>
            <div className="mt-1 text-xs text-brand-400">— Philippians 4:6</div>
          </div>
          <button onClick={() => { setStep(1); setForm({ requesterName:'', email:'', phone:'', category:'', title:'', description:'', isAnonymous:false }) }}
            className="text-sm text-brand-600 dark:text-brand-400 hover:underline">
            Submit another request
          </button>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-indigo-950 flex items-center justify-center p-4 py-10">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">

        {/* Header */}
        <div className="bg-brand-950 px-8 py-7 text-center">
          <div className="w-14 h-14 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart className="w-7 h-7 text-gold-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">{CHURCH}</h1>
          <p className="text-brand-300 text-sm mt-1">Prayer Request</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center -mt-1">
            Share your prayer need with us. We will pray with you and follow up personally.
          </p>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Name <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Full name"
              value={form.requesterName}
              onChange={e => set('requesterName', e.target.value)}
              required
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input
                type="tel"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="07xx xxx xxx"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">Provide at least one contact so we can notify you when your prayer is answered.</p>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button"
                  onClick={() => set('category', cat.value)}
                  className={clsx(
                    'px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-all',
                    form.category === cat.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-brand-300'
                  )}>
                  <div>{cat.label}</div>
                  <div className="text-xs opacity-60 mt-0.5 font-normal">{cat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Request Title <span className="text-red-400">*</span>
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Brief title e.g. 'Prayer for my mother's recovery'"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Prayer Request <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Share as much or as little as you feel comfortable with..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              required
            />
          </div>

          {/* Anonymous */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" className="rounded w-4 h-4"
              checked={form.isAnonymous} onChange={e => set('isAnonymous', e.target.checked)} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Keep my name private (submit anonymously to the congregation)
            </span>
          </label>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-3 px-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
            <HandHeart className="w-4 h-4" />
            {loading ? 'Submitting...' : 'Submit Prayer Request'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Your request is handled with care and confidentiality.
          </p>
        </form>
      </div>
    </div>
  )
}
