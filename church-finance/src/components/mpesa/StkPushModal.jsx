import { useState } from 'react'
import Modal from '../common/Modal'
import { INCOME_CATEGORIES } from '../../utils/mockData'
import { Smartphone } from 'lucide-react'

const emptyForm = { phone: '', amount: '', name: '', category: 'Tithe' }

export default function StkPushModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit({ ...form, amount: Number(form.amount) })
    setSubmitting(false)
    setForm(emptyForm)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initiate STK Push" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <p className="text-xs text-green-700">A payment prompt will be sent to the customer's phone via M-Pesa.</p>
        </div>
        <div>
          <label className="label">Contributor Name</label>
          <input
            type="text" name="name" className="input-field"
            placeholder="e.g. Jane Doe"
            value={form.name} onChange={handleChange} required
          />
        </div>
        <div>
          <label className="label">Phone Number</label>
          <input
            type="tel" name="phone" className="input-field"
            placeholder="07XXXXXXXX"
            value={form.phone} onChange={handleChange} required
          />
        </div>
        <div>
          <label className="label">Amount (KES)</label>
          <input
            type="number" name="amount" min="1" className="input-field"
            placeholder="0.00"
            value={form.amount} onChange={handleChange} required
          />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category" className="input-field" value={form.category} onChange={handleChange}>
            {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? 'Sending...' : 'Send STK Push'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
