import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { CHURCH_NAME, CHURCH_TAGLINE } from '../utils/mockData'
import { Church, Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post(`${BASE}/auth/forgot-password`, { email })
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md">

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-brand-950 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <Church className="w-5 h-5 text-brand-950" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">{CHURCH_NAME}</p>
                <p className="text-blue-300 text-xs">{CHURCH_TAGLINE}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            {sent ? (
              /* Success state */
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Check your email</h2>
                  <p className="text-sm text-gray-400 mt-2">
                    If <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span> is registered,
                    you'll receive a password reset link shortly.
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  Didn't receive it? Check your spam folder or{' '}
                  <button onClick={() => setSent(false)} className="text-brand-600 font-medium hover:underline">
                    try again
                  </button>.
                </p>
                <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-brand-600 font-semibold hover:underline mt-4">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            ) : (
              /* Form state */
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Forgot Password?</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Enter your email and we'll send you a reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="fp-email"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="w-full border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={clsx(
                      'w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-colors',
                      'bg-brand-600 hover:bg-brand-700',
                      loading && 'opacity-80 cursor-not-allowed'
                    )}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                      : 'Send Reset Link'
                    }
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/login" className="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-brand-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          © {new Date().getFullYear()} {CHURCH_NAME}
        </p>
      </div>
    </div>
  )
}
