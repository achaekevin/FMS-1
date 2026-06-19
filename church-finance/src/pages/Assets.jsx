import { useState, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { formatCurrency, formatDate, ASSET_CATEGORIES, ASSET_CONDITIONS } from '../utils/mockData'
import { Plus, Pencil, Trash2, Package, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const conditionColors = {
  Excellent: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Good: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Fair: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  Poor: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Disposed: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
}

const emptyForm = {
  name: '', category: 'Electronics', purchaseDate: new Date().toISOString().split('T')[0],
  value: '', condition: 'Good', status: 'Active', location: '', description: '', serialNumber: '',
}

function AssetFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyForm)
  useState(() => { setForm(initialData ? { ...initialData } : emptyForm) }, [initialData, isOpen])
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({ ...form, value: Number(form.value) })
    onClose()
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Asset' : 'Add Asset'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Asset Name</label>
            <input name="name" className="input-field" placeholder="e.g. Church Van" value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="input-field" value={form.category} onChange={handleChange}>
              {ASSET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Purchase Date</label>
            <input type="date" name="purchaseDate" className="input-field" value={form.purchaseDate} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Value (KES)</label>
            <input type="number" name="value" min="0" className="input-field" placeholder="0.00" value={form.value} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Condition</label>
            <select name="condition" className="input-field" value={form.condition} onChange={handleChange}>
              {ASSET_CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" className="input-field" value={form.status} onChange={handleChange}>
              {['Active', 'Under Maintenance', 'Inactive', 'Disposed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input name="location" className="input-field" placeholder="Where is this asset?" value={form.location} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Serial Number</label>
            <input name="serialNumber" className="input-field" placeholder="Optional" value={form.serialNumber} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={2} className="input-field resize-none" placeholder="Notes..." value={form.description} onChange={handleChange} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{initialData ? 'Save Changes' : 'Add Asset'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Assets() {
  const { assets, addAsset, updateAsset, deleteAsset } = useFinance()
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')

  const filtered = useMemo(() => {
    return assets.filter(a => {
      const q = search.toLowerCase()
      return (!search || a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
        && (!catFilter || a.category === catFilter)
    })
  }, [assets, search, catFilter])

  const totalValue = filtered.reduce((s, a) => s + Number(a.value), 0)

  const handleSave = (data) => {
    if (editRecord) { updateAsset(editRecord.id, data, user); toast.success('Asset updated') }
    else { addAsset(data, user); toast.success('Asset added') }
    setEditRecord(null)
  }
  const handleDelete = () => {
    const a = assets.find(x => x.id === deleteId)
    deleteAsset(deleteId, a?.name, user)
    toast.success('Asset deleted')
    setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Asset Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track and manage church assets</p>
        </div>
        <button onClick={() => { setEditRecord(null); setModalOpen(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-brand-600" />
          </div>
          <div><p className="text-xs text-gray-400">Total Assets</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{assets.length}</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <span className="text-green-600 font-bold text-xs">KES</span>
          </div>
          <div><p className="text-xs text-gray-400">Total Value</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalValue)}</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div><p className="text-xs text-gray-400">Active</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{assets.filter(a => a.status === 'Active').length}</p></div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" className="input-field pl-9" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field sm:w-44" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>
            {ASSET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Asset</th>
                <th className="table-header">Category</th>
                <th className="table-header hidden md:table-cell">Purchase Date</th>
                <th className="table-header">Condition</th>
                <th className="table-header hidden lg:table-cell">Location</th>
                <th className="table-header text-right">Value</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">No assets found</td></tr>
              )}
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="table-cell">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{a.name}</p>
                      {a.serialNumber && <p className="text-xs text-gray-400">S/N: {a.serialNumber}</p>}
                    </div>
                  </td>
                  <td className="table-cell"><span className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{a.category}</span></td>
                  <td className="table-cell hidden md:table-cell text-xs text-gray-400">{formatDate(a.purchaseDate)}</td>
                  <td className="table-cell"><span className={clsx('badge', conditionColors[a.condition] || conditionColors.Good)}>{a.condition}</span></td>
                  <td className="table-cell hidden lg:table-cell text-gray-500 dark:text-gray-400">{a.location || '—'}</td>
                  <td className="table-cell text-right font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(a.value)}</td>
                  <td className="table-cell text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setEditRecord(a); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AssetFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditRecord(null) }} onSubmit={handleSave} initialData={editRecord} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Asset?" message="This asset record will be permanently removed." />
    </div>
  )
}
