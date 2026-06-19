import { useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import { Settings as SettingsIcon, Church, Phone, Mail, MapPin, DollarSign, Calendar, Save, Sun, Moon } from 'lucide-react'
import toast from 'react-hot-toast'

const CURRENCIES = ['KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS']
const FISCAL_YEARS = ['January - December', 'April - March', 'July - June', 'October - September']

export default function Settings() {
  const { settings, updateSettings } = useFinance()
  const { user, darkMode, toggleDarkMode } = useAuth()
  const [form, setForm] = useState({ ...settings })
  const [saving, setSaving] = useState(false)

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    updateSettings(form, user)
    toast.success('Settings saved successfully')
    setSaving(false)
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

      {/* System info */}
      <div className="card p-5">
        <h2 className="section-title">System Information</h2>
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
