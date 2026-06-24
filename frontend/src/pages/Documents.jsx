import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  FolderOpen, Upload, Download, Trash2, Pencil, Eye, Search, Filter,
  FileText, FileImage, File, X, Plus, RefreshCw, Loader2, HardDrive,
  ChevronLeft, ChevronRight, Tag, Calendar, User, AlertCircle,
  Receipt, FileStack, ScrollText, ClipboardList, BarChart2,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────
const CATEGORIES = ['Receipt', 'Invoice', 'Contract', 'Minutes', 'Report', 'Other']

const CAT_CONFIG = {
  Receipt:  { icon: Receipt,       color: 'text-green-600',  bg: 'bg-green-50  dark:bg-green-900/30'  },
  Invoice:  { icon: FileStack,     color: 'text-blue-600',   bg: 'bg-blue-50   dark:bg-blue-900/30'   },
  Contract: { icon: ScrollText,    color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  Minutes:  { icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30' },
  Report:   { icon: BarChart2,     color: 'text-brand-600',  bg: 'bg-brand-50  dark:bg-brand-900/30'  },
  Other:    { icon: File,          color: 'text-gray-500',   bg: 'bg-gray-100  dark:bg-gray-700'      },
}

const MIME_ICONS = {
  'application/pdf':  FileText,
  'image/jpeg':       FileImage,
  'image/png':        FileImage,
  'text/plain':       FileText,
  'text/csv':         FileText,
}

const getMimeIcon = (mime) => MIME_ICONS[mime] || File

const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  if (bytes < 1024)           return `${bytes} B`
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

// ─── Upload Modal ─────────────────────────────────────────
function UploadModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm]       = useState({ title: '', category: 'Other', description: '', tags: '' })
  const [file, setFile]       = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const fileRef               = useRef()

  const reset = () => { setForm({ title: '', category: 'Other', description: '', tags: '' }); setFile(null) }

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    if (!form.title) setForm(p => ({ ...p, title: f.name.replace(/\.[^.]+$/, '') }))
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { toast.error('Please select a file'); return }
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title.trim())
      fd.append('category', form.category)
      if (form.description) fd.append('description', form.description)
      if (form.tags)        fd.append('tags', form.tags)

      const stored = JSON.parse(sessionStorage.getItem('glc_user') || '{}')
      const base   = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const resp   = await fetch(`${base}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${stored?.token || ''}` },
        body: fd,
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.message || 'Upload failed')
      toast.success('Document uploaded successfully')
      reset(); onSuccess(); onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose() }} title="Upload Document" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={clsx(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
            dragOver ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                     : 'border-gray-200 dark:border-gray-600 hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          )}
        >
          <input ref={fileRef} type="file" className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt,.csv"
            onChange={e => handleFile(e.target.files[0])} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-brand-600" />
              <div className="text-left">
                <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">{file.name}</p>
                <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
              </div>
              <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                className="ml-auto p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Drag & drop a file here, or <span className="text-brand-600 font-medium">click to browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, Image, TXT — up to 10 MB</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Title <span className="text-red-400">*</span></label>
            <input className="input-field" placeholder="Document title"
              value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input-field" value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input className="input-field" placeholder="e.g. 2026, Q1, board"
              value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description (optional)</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Brief description..."
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => { reset(); onClose() }} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading || !file} className="btn-primary disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Edit Modal ───────────────────────────────────────────
function EditModal({ doc, onClose, onSuccess }) {
  const [form, setForm]   = useState({ title: '', category: 'Other', description: '', tags: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (doc) setForm({
      title: doc.title || '',
      category: doc.category || 'Other',
      description: doc.description || '',
      tags: doc.tags || '',
    })
  }, [doc])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put(`/documents/${doc.id}`, form)
      toast.success('Document updated')
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={!!doc} onClose={onClose} title="Edit Document" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title <span className="text-red-400">*</span></label>
          <input className="input-field" value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input-field" value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tags</label>
            <input className="input-field" placeholder="tag1, tag2"
              value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input-field resize-none" rows={3}
            value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Detail Modal ─────────────────────────────────────────
function DetailModal({ doc, onClose, onDownload }) {
  if (!doc) return null
  const cfg  = CAT_CONFIG[doc.category] || CAT_CONFIG.Other
  const Icon = cfg.icon
  const FileIcon = getMimeIcon(doc.mimeType)
  const tags = doc.tags ? doc.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <Modal isOpen={!!doc} onClose={onClose} title="Document Details" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
            <Icon className={clsx('w-6 h-6', cfg.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">{doc.title}</p>
            <span className={clsx('badge text-xs mt-1 inline-block', cfg.bg, cfg.color)}>{doc.category}</span>
          </div>
        </div>

        {doc.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            {doc.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { icon: FileIcon,  label: 'File',      value: doc.originalName },
            { icon: HardDrive, label: 'Size',       value: formatBytes(doc.fileSize) },
            { icon: User,      label: 'Uploaded by',value: doc.uploader?.name || '—' },
            { icon: Calendar,  label: 'Date',       value: formatDate(doc.createdAt) },
            { icon: Download,  label: 'Downloads',  value: doc.downloadCount || 0 },
          ].map(f => (
            <div key={f.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex items-start gap-2">
              <f.icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">{f.label}</p>
                <p className="font-medium text-gray-800 dark:text-gray-100 break-all text-xs">{f.value}</p>
              </div>
            </div>
          ))}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map(t => (
              <span key={t} className="px-2 py-0.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs rounded-full flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t dark:border-gray-700">
          <button onClick={onClose} className="btn-secondary">Close</button>
          <button onClick={() => onDownload(doc)} className="btn-primary">
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function Documents() {
  const { user } = useAuth()
  const isAdminOrTreasurer = ['administrator', 'treasurer'].includes(user?.role)

  const [docs,    setDocs]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(false)
  const [stats,   setStats]   = useState(null)

  const [search,    setSearch]    = useState('')
  const [category,  setCategory]  = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [uploadOpen,  setUploadOpen]  = useState(false)
  const [editDoc,     setEditDoc]     = useState(null)
  const [detailDoc,   setDetailDoc]   = useState(null)
  const [deleteId,    setDeleteId]    = useState(null)
  const [deleteName,  setDeleteName]  = useState('')
  const [downloading, setDownloading] = useState(null)

  const LIMIT = 20

  const fetchDocs = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: LIMIT }
      if (search)    params.search    = search
      if (category)  params.category  = category
      if (startDate) params.startDate = startDate
      if (endDate)   params.endDate   = endDate
      const res = await api.get('/documents', { params })
      setDocs(res.data.data || [])
      setTotal(res.data.meta?.total || 0)
      setPage(p)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, category, startDate, endDate])

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/documents/stats')
      setStats(res.data.data)
    } catch (_) {}
  }, [])

  useEffect(() => { fetchDocs(1) }, [fetchDocs])
  useEffect(() => { fetchStats() }, [fetchStats])

  const handleDownload = async (doc) => {
    setDownloading(doc.id)
    try {
      const base    = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const stored  = JSON.parse(sessionStorage.getItem('glc_user') || '{}')
      const resp    = await fetch(`${base}/documents/${doc.id}/download`, {
        headers: { Authorization: `Bearer ${stored?.token || ''}` },
      })
      if (!resp.ok) throw new Error('Download failed')
      const blob = await resp.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = doc.originalName
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded: ${doc.originalName}`)
      // Refresh to update download count
      fetchDocs(page)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDownloading(null)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/documents/${deleteId}`)
      toast.success('Document deleted')
      setDeleteId(null); setDeleteName('')
      fetchDocs(1); fetchStats()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const clearFilters = () => {
    setSearch(''); setCategory(''); setStartDate(''); setEndDate('')
  }
  const hasFilters = search || category || startDate || endDate
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Document Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Store, organise and download receipts, invoices, contracts and minutes
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { fetchDocs(1); fetchStats() }} className="btn-secondary" title="Refresh">
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setShowFilters(f => !f)}
            className={clsx('btn-secondary', hasFilters && 'border-brand-400 text-brand-600')}>
            <Filter className="w-4 h-4" />
            Filters
            {hasFilters && <span className="ml-1 w-2 h-2 bg-brand-500 rounded-full inline-block" />}
          </button>
          {isAdminOrTreasurer && (
            <button onClick={() => setUploadOpen(true)} className="btn-primary">
              <Upload className="w-4 h-4" /> Upload
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-brand-600">{stats.total}</p>
            <p className="text-xs text-gray-400">Total Documents</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-xl font-bold text-blue-600">{stats.totalSizeFormatted}</p>
            <p className="text-xs text-gray-400">Storage Used</p>
          </div>
          {stats.byCategory?.slice(0, 2).map(c => (
            <div key={c.category} className="card p-3 text-center">
              <p className={clsx('text-xl font-bold', CAT_CONFIG[c.category]?.color || 'text-gray-600')}>
                {c.count}
              </p>
              <p className="text-xs text-gray-400">{c.category}s</p>
            </div>
          ))}
        </div>
      )}

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={clsx('px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
            !category ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-brand-300'
          )}
        >
          All
        </button>
        {CATEGORIES.map(c => {
          const cfg = CAT_CONFIG[c]
          const Icon = cfg.icon
          return (
            <button
              key={c}
              onClick={() => setCategory(category === c ? '' : c)}
              className={clsx('px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5',
                category === c
                  ? `${cfg.bg} ${cfg.color} border-current`
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300'
              )}
            >
              <Icon className="w-3.5 h-3.5" />{c}
            </button>
          )
        })}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
              <Filter className="w-4 h-4" /> Advanced Filters
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="input-field pl-9" placeholder="Search title, tags, description…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div>
              <label className="label">From</label>
              <input type="date" className="input-field" value={startDate}
                onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label">To</label>
              <input type="date" className="input-field" value={endDate}
                onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {total > 0 ? `${total} document${total !== 1 ? 's' : ''}` : 'No documents'}
          </p>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-brand-600" />}
        </div>

        {/* Empty state */}
        {!loading && docs.length === 0 && (
          <div className="py-16 text-center">
            <FolderOpen className="w-12 h-12 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No documents found</p>
            {hasFilters
              ? <button onClick={clearFilters} className="mt-2 text-xs text-brand-600 hover:underline">Clear filters</button>
              : isAdminOrTreasurer && (
                  <button onClick={() => setUploadOpen(true)} className="mt-3 btn-primary text-sm">
                    <Plus className="w-4 h-4" /> Upload your first document
                  </button>
                )
            }
          </div>
        )}

        {loading && docs.length === 0 && (
          <div className="py-16 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-brand-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Loading documents…</p>
          </div>
        )}

        {/* Rows */}
        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
          {docs.map(doc => {
            const cfg      = CAT_CONFIG[doc.category] || CAT_CONFIG.Other
            const CatIcon  = cfg.icon
            const FileIcon = getMimeIcon(doc.mimeType)
            const tags     = doc.tags ? doc.tags.split(',').map(t => t.trim()).filter(Boolean) : []
            const canEdit  = isAdminOrTreasurer && (user?.role === 'administrator' || doc.uploadedBy === user?.id)

            return (
              <div key={doc.id} className="px-5 py-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                {/* Category icon */}
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
                  <CatIcon className={clsx('w-5 h-5', cfg.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{doc.title}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <FileIcon className="w-3 h-3" /> {doc.originalName}
                        </span>
                        <span className="text-xs text-gray-400">{formatBytes(doc.fileSize)}</span>
                        <span className="text-xs text-gray-400">{formatDate(doc.createdAt)}</span>
                        {doc.uploader && (
                          <span className="text-xs text-gray-400">{doc.uploader.name}</span>
                        )}
                        {doc.downloadCount > 0 && (
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <Download className="w-3 h-3" />{doc.downloadCount}
                          </span>
                        )}
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs rounded-full">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setDetailDoc(doc)}
                        title="View details"
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        disabled={downloading === doc.id}
                        title="Download"
                        className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                      >
                        {downloading === doc.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Download className="w-4 h-4" />}
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => setEditDoc(doc)}
                            title="Edit"
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setDeleteId(doc.id); setDeleteName(doc.title) }}
                            title="Delete"
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => fetchDocs(page - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i
                if (p < 1 || p > totalPages) return null
                return (
                  <button key={p} onClick={() => fetchDocs(p)}
                    className={clsx('w-7 h-7 text-xs rounded-lg font-medium transition-colors',
                      p === page ? 'bg-brand-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                    )}>
                    {p}
                  </button>
                )
              })}
              <button disabled={page >= totalPages} onClick={() => fetchDocs(page + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)}
        onSuccess={() => { fetchDocs(1); fetchStats() }} />
      <EditModal doc={editDoc} onClose={() => setEditDoc(null)}
        onSuccess={() => fetchDocs(page)} />
      <DetailModal doc={detailDoc} onClose={() => setDetailDoc(null)}
        onDownload={(d) => { handleDownload(d); setDetailDoc(null) }} />
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => { setDeleteId(null); setDeleteName('') }}
        onConfirm={handleDelete}
        title="Delete Document?"
        message={`"${deleteName}" will be permanently removed from disk. This cannot be undone.`}
      />
    </div>
  )
}
