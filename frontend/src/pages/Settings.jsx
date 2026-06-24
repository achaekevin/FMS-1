import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import { Settings as SettingsIcon, Church, Phone, Mail, MapPin, DollarSign, Calendar, Save, Sun, Moon, Shield, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const CURRENCIES   = ['KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS']
const FISCAL_YEARS = ['January - December', 'April - March', 'July - June', 'October - September']

export default function Settings() {
  const { user, darkMode, toggleDarkMode } = useAuth()
  const [form, setForm] = useState({
    churchName: '', address: '', phone: '', email: '',
    currency: 'KES', fiscalYear: 'January - December', dual_auth_threshold: '5000',
  })
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/settings').then(res => {
      const s = res.data.data || {}
      setForm({
        churchName:           s.church_name    || '',
        address:              s.church_address || '',
        phone:                s.church_phone   || '',
        email:                s.church_email   || '',
        currency:             s.currency       || 'KES',
        fiscalYear:           s.fiscal_year    || 'January - December',
        dual_auth_threshold:  s.dual_auth_threshold || '5000',
      })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/settings', {
        church_name:          form.churchName,
        church_address:       form.address,
        church_phone:         form.phone,
        church_email:         form.email,
        currency:             form.currency,
        fiscal_year:          form.fiscalYear,
        dual_auth_threshold:  String(form.dual_auth_threshold),
      })
      toast.success('Settings saved successfully')
    } catch (err) { toast.error(err.message || 'Failed to save settings') }
    finally { setSaving(false) }
  }

  const isAdmin = user?.role === 'administrator'

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configure church information and system preferences</p>
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h2 className="section-title flex items-center gap-2"><SettingsIcon className="w-4 h-4 text-brand-600" /> Appearance</h2>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Dark Mode</p>
            <p className="text-xs text-gray-400">Toggle between light and dark themes</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? <><Sun className="w-4 h-4 text-yellow-500" /> Light Mode</> : <><Moon className="w-4 h-4 text-brand-600" /> Dark Mode</>}
          </button>
        </div>
      </div>

      {/* Church info */}
      <div className="card p-5">
        <h2 className="section-title flex items-center gap-2"><Church className="w-4 h-4 text-brand-600" /> Church Information</h2>
        {!isAdmin && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-700 dark:text-yellow-300">
            Only administrators can edit church settings.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label flex items-center gap-1.5"><Church className="w-3.5 h-3.5" /> Church Name</label>
            <input name="churchName" className="input-field" value={form.churchName} onChange={handleChange} disabled={!isAdmin} />
          </div>
          <div className="sm:col-span-2">
            <label className="label flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address</label>
            <input name="address" className="input-field" value={form.address} onChange={handleChange} disabled={!isAdmin} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone Number</label>
            <input name="phone" className="input-field" value={form.phone} onChange={handleChange} disabled={!isAdmin} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email Address</label>
            <input type="email" name="email" className="input-field" value={form.email} onChange={handleChange} disabled={!isAdmin} />
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Currency</label>
            <select name="currency" className="input-field" value={form.currency} onChange={handleChange} disabled={!isAdmin}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Fiscal Year</label>
            <select name="fiscalYear" className="input-field" value={form.fiscalYear} onChange={handleChange} disabled={!isAdmin}>
              {FISCAL_YEARS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
        {isAdmin && (
          <div className="mt-4 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-70">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>

      {/* Dual-Authorization */}
      <div className="card p-5">
        <h2 className="section-title flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-600" /> Dual-Authorization (Maker-Checker)
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Expenses that meet or exceed this threshold require approval from both the <strong>Pastor</strong> and the <strong>Administrator</strong> before funds are disbursed. Set to <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">0</code> to require dual-auth for every expense.
        </p>
        <div className="max-w-xs">
          <label className="label flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Approval Threshold (KES)</label>
          <input
            type="number" min="0" step="500"
            name="dual_auth_threshold"
            className="input-field"
            value={form.dual_auth_threshold}
            onChange={handleChange}
            disabled={!isAdmin}
            placeholder="e.g. 5000"
          />
          <p className="text-xs text-gray-400 mt-1">
            Current: expenses ≥ KES {Number(form.dual_auth_threshold || 0).toLocaleString()} require dual-auth.
            Below this amount are auto-approved immediately.
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 flex justify-end">
            <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-70">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Settings</>}
            </button>
          </div>
        )}
      </div>

      {/* System info */}
      <div className="card p-5">        <h2 className="section-title">System Information</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Version', value: '2.0.0' },
            { label: 'Build', value: 'Production' },
            { label: 'Database', value: 'In-Memory (Demo)' },
            { label: 'Session', value: user?.role || '—' },
          ].map(f => (
            <div key={f.label} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <p className="text-xs text-gray-400">{f.label}</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{f.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
