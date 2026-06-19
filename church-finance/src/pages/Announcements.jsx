import { useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { formatDate } from '../utils/mockData'
import { Megaphone, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const PRIORITIES = ['High', 'Medium', 'Low']
const priorityColors = {
  High: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  Medium: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  Low: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
}

const emptyForm = { title: '', content: '', priority: 'Medium', expiryDate: '' }

function AnnouncementFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyForm)
  useState(() => { setForm(initialData ? { ...initialData } : emptyForm) }, [initialData, isOpen])
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = e => {
    e.preventDefault()
    onSubmit(form)
    onClose()
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Announcement' : 'New Announcement'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input name="title" className="input-field" placeholder="Announcement title..." value={form.title} onChange={handleChange} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Priority</label>
            <select name="priority" className="input-field" value={form.priority} onChange={handleChange}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Expiry Date (Optional)</label>
            <input type="date" name="expiryDate" className="input-field" value={form.expiryDate} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className="label">Content</label>
          <textarea name="content" rows={5} className="input-field resize-none" placeholder="Announcement details..." value={form.content} onChange={handleChange} required />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{initialData ? 'Save Changes' : 'Publish'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Announcements() {
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useFinance()
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [viewAnn, setViewAnn] = useState(null)

  const handleSave = (data) => {
    if (editRecord) { updateAnnouncement(editRecord.id, data, user); toast.success('Announcement updated') }
    else { addAnnouncement(data, user); toast.success('Announcement published') }
    setEditRecord(null)
  }
  const handleDelete = () => {
    const a = announcements.find(x => x.id === deleteId)
    deleteAnnouncement(deleteId, a?.title, user)
    toast.success('Announcement deleted')
    setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="text-sm text-gray-400 mt-0.5">Post and manage church announcements</p>
        </div>
        <button onClick={() => { setEditRecord(null); setModalOpen(true) }} className="btn-primary">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="card p-12 text-center">
          <Megaphone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No announcements yet. Create your first announcement!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const isExpired = a.expiryDate && new Date(a.expiryDate) < new Date()
            return (
              <div key={a.id} className={clsx('card p-4 border-l-4 transition-all', isExpired ? 'opacity-60 border-gray-300' : 'border-brand-500')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{a.title}</p>
                      <span className={clsx('badge border', priorityColors[a.priority] || priorityColors.Medium)}>{a.priority}</span>
                      {isExpired && <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-500">Expired</span>}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{a.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>By {a.author}</span>
                      <span>·</span>
                      <span>{formatDate(a.createdAt)}</span>
                      {a.expiryDate && <span>· Expires {formatDate(a.expiryDate)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setViewAnn(a)} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-600"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { setEditRecord(a); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* View modal */}
      <Modal isOpen={!!viewAnn} onClose={() => setViewAnn(null)} title="Announcement" size="md">
        {viewAnn && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{viewAnn.title}</h3>
              <span className={clsx('badge border', priorityColors[viewAnn.priority])}>{viewAnn.priority}</span>
            </div>
            <div className="text-xs text-gray-400">By {viewAnn.author} · {formatDate(viewAnn.createdAt)}</div>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">{viewAnn.content}</p>
            </div>
            {viewAnn.expiryDate && <p className="text-xs text-gray-400 border-t dark:border-gray-700 pt-3">Expires: {formatDate(viewAnn.expiryDate)}</p>}
          </div>
        )}
      </Modal>

      <AnnouncementFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditRecord(null) }} onSubmit={handleSave} initialData={editRecord} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Announcement?" message="This announcement will be permanently removed." />
    </div>
  )
}
