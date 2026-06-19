import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { EXPENSE_CATEGORIES, FUND_NAMES } from '../../utils/mockData'

const emptyForm = {
  category: 'Utilities', amount: '', description: '',
  date: new Date().toISOString().split('T')[0], approvedBy: '', fund: 'General Fund',
}

export default function ExpenseFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setForm(initialData ? { ...initialData } : emptyForm)
  }, [initialData, isOpen])

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...form, amount: Number(form.amount) })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Expense' : 'Record New Expense'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Expense Category</label>
            <select name="category" className="input-field" value={form.category} onChange={handleChange}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Amount (KES)</label>
            <input
              type="number" name="amount" min="1" step="0.01"
              className="input-field" placeholder="0.00"
              value={form.amount} onChange={handleChange} required
            />
          </div>
          <div>
            <label className="label">Fund</label>
            <select name="fund" className="input-field" value={form.fund} onChange={handleChange}>
              {FUND_NAMES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" name="date" className="input-field" value={form.date} onChange={handleChange} required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Approved By</label>
            <input
              type="text" name="approvedBy" className="input-field"
              placeholder="Name of approving authority"
              value={form.approvedBy} onChange={handleChange} required
            />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            name="description" rows={2} className="input-field resize-none"
            placeholder="What was this expense for?"
            value={form.description} onChange={handleChange} required
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{initialData ? 'Save Changes' : 'Record Expense'}</button>
        </div>
      </form>
    </Modal>
  )
}
