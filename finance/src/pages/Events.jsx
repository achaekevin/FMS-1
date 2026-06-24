import { useState, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { formatDate, EVENT_TYPES } from '../utils/mockData'
import { Plus, Pencil, Trash2, Calendar, MapPin, Users, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const typeColors = {
  Conference: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Crusade: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Fundraiser: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Meeting: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Service: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
  Outreach: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Training: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

const emptyForm = {
  title: '', type: 'Service', date: new Date().toISOString().split('T')[0],
  endDate: '', location: '', description: '', expectedAttendance: '', budget: '',
}

function EventFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyForm)

  useState(() => { setForm(initialData ? { ...initialData } : emptyForm) }, [initialData, isOpen])
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({ ...form, expectedAttendance: Number(form.expectedAttendance) || 0, budget: Number(form.budget) || 0 })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Event' : 'Add Event'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Event Title</label>
            <input name="title" className="input-field" placeholder="e.g. Annual Conference 2024" value={form.title} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">Event Type</label>
            <select name="type" className="input-field" value={form.type} onChange={handleChange}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Start Date</label>
            <input type="date" name="date" className="input-field" value={form.date} onChange={handleChange} required />
          </div>
          <div>
            <label className="label">End Date</label>
            <input type="date" name="endDate" className="input-field" value={form.endDate} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Location</label>
            <input name="location" className="input-field" placeholder="Venue / Address" value={form.location} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Expected Attendance</label>
            <input type="number" name="expectedAttendance" className="input-field" placeholder="0" value={form.expectedAttendance} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Budget (KES)</label>
            <input type="number" name="budget" className="input-field" placeholder="0" value={form.budget} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={3} className="input-field resize-none" placeholder="Event details..." value={form.description} onChange={handleChange} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{initialData ? 'Save Changes' : 'Add Event'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function Events() {
  const { events, addEvent, updateEvent, deleteEvent } = useFinance()
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [view, setView] = useState('list') // list | calendar
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = useMemo(() => {
    return events.filter(e => !typeFilter || e.type === typeFilter)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [events, typeFilter])

  const upcoming = events.filter(e => new Date(e.date) >= new Date()).length
  const past = events.filter(e => new Date(e.date) < new Date()).length

  const handleSave = (data) => {
    if (editRecord) { updateEvent(editRecord.id, data, user); toast.success('Event updated') }
    else { addEvent(data, user); toast.success('Event added') }
    setEditRecord(null)
  }

  const handleDelete = () => {
    const ev = events.find(x => x.id === deleteId)
    deleteEvent(deleteId, ev?.title, user)
    toast.success('Event deleted')
    setDeleteId(null)
  }

  // Calendar view — group events by month
  const byMonth = useMemo(() => {
    const groups = {}
    filtered.forEach(e => {
      const key = new Date(e.date).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' })
      if (!groups[key]) groups[key] = []
      groups[key].push(e)
    })
    return groups
  }, [filtered])

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Event Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Plan and manage church events</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {['list', 'calendar'].map(v => (
              <button key={v} onClick={() => setView(v)} className={clsx('px-3 py-1.5 text-xs font-medium transition-colors capitalize', view === v ? 'bg-brand-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700')}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditRecord(null); setModalOpen(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-brand-600" />
          </div>
          <div><p className="text-xs text-gray-400">Total Events</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{events.length}</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div><p className="text-xs text-gray-400">Upcoming</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{upcoming}</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-gray-500" />
          </div>
          <div><p className="text-xs text-gray-400">Past</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{past}</p></div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTypeFilter('')} className={clsx('text-xs font-medium px-3 py-1.5 rounded-full transition-colors', !typeFilter ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')}>All</button>
        {EVENT_TYPES.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} className={clsx('text-xs font-medium px-3 py-1.5 rounded-full transition-colors', typeFilter === t ? 'bg-brand-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">No events yet. Add your first event!</p>
        </div>
      ) : view === 'list' ? (
        <div className="space-y-3">
          {filtered.map(ev => {
            const isPast = new Date(ev.date) < new Date()
            return (
              <div key={ev.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover-lift">
                <div className="w-14 h-14 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-brand-600">{new Date(ev.date).toLocaleDateString('en-KE', { month: 'short' })}</span>
                  <span className="text-xl font-bold text-brand-700">{new Date(ev.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">{ev.title}</p>
                    <span className={clsx('badge', typeColors[ev.type] || typeColors.Other)}>{ev.type}</span>
                    {isPast && <span className="badge bg-gray-100 dark:bg-gray-700 text-gray-500">Past</span>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400 flex-wrap">
                    {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>}
                    {ev.expectedAttendance > 0 && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{ev.expectedAttendance.toLocaleString()} expected</span>}
                    {ev.endDate && ev.endDate !== ev.date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Until {formatDate(ev.endDate)}</span>}
                  </div>
                  {ev.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{ev.description}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditRecord(ev); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(ev.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // Calendar view — grouped by month
        <div className="space-y-6">
          {Object.entries(byMonth).map(([month, evs]) => (
            <div key={month}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> {month}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {evs.map(ev => (
                  <div key={ev.id} className="card p-4 border-l-4 border-brand-500">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{ev.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(ev.date)}</p>
                      </div>
                      <span className={clsx('badge text-xs', typeColors[ev.type] || typeColors.Other)}>{ev.type}</span>
                    </div>
                    {ev.location && <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</p>}
                    <div className="flex gap-1 mt-3">
                      <button onClick={() => { setEditRecord(ev); setModalOpen(true) }} className="p-1 rounded hover:bg-blue-50 text-blue-500"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => setDeleteId(ev.id)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <EventFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditRecord(null) }} onSubmit={handleSave} initialData={editRecord} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Event?" message="This event will be permanently removed." />
    </div>
  )
}
