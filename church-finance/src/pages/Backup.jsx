import { useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { Database, Download, Upload, Plus, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Backup() {
  const { income, expenses, members, funds, budgets, events, assets, employees, logs } = useFinance()
  const [backups, setBackups] = useState([])
  const [restoring, setRestoring] = useState(false)

  const handleCreateBackup = () => {
    const data = { income, expenses, members, funds, budgets, events, assets, employees, logs, createdAt: new Date().toISOString(), version: '2.0.0' }
    const entry = { id: Date.now(), name: `Backup-${new Date().toLocaleDateString('en-KE').replace(/\//g, '-')}`, size: `${(JSON.stringify(data).length / 1024).toFixed(1)} KB`, createdAt: new Date().toISOString(), data }
    setBackups(prev => [entry, ...prev])
    toast.success('Backup created successfully')
  }

  const handleDownload = (backup) => {
    const blob = new Blob([JSON.stringify(backup.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${backup.name}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup downloaded')
  }

  const handleRestore = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setRestoring(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.version || !data.income) throw new Error('Invalid backup file')
      toast.success('Backup file validated. Restore functionality requires backend integration.')
    } catch (err) {
      toast.error('Invalid backup file')
    } finally {
      setRestoring(false)
      e.target.value = ''
    }
  }

  const totalRecords = income.length + expenses.length + members.length + events.length + assets.length + employees.length + logs.length

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="page-title">Backup & Restore</h1>
        <p className="text-sm text-gray-400 mt-0.5">Create and manage system data backups</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Income Records', count: income.length },
          { label: 'Expense Records', count: expenses.length },
          { label: 'Members', count: members.length },
          { label: 'Total Records', count: totalRecords },
        ].map(s => (
          <div key={s.label} className="card p-3 text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{s.count}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">Create Backup</p>
              <p className="text-xs text-gray-400">Save current system state</p>
            </div>
          </div>
          <button onClick={handleCreateBackup} className="btn-primary w-full justify-center">
            <Database className="w-4 h-4" /> Create Backup Now
          </button>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-100">Restore Backup</p>
              <p className="text-xs text-gray-400">Load from a backup file</p>
            </div>
          </div>
          <label className="btn-secondary w-full justify-center cursor-pointer">
            <Upload className="w-4 h-4" /> {restoring ? 'Restoring...' : 'Choose Backup File'}
            <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
          </label>
        </div>
      </div>

      {/* Backup history */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="section-title mb-0">Backup History</h3>
        </div>
        {backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">No backups yet</p>
            <p className="text-xs text-gray-300 mt-1">Create your first backup above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {backups.map(b => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{b.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(b.createdAt).toLocaleString('en-KE')}</span>
                      <span>· {b.size}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDownload(b)} className="btn-secondary px-3 py-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
