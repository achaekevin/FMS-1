import { useState, useEffect } from 'react'
import Modal from '../common/Modal'
import { INCOME_CATEGORIES, PAYMENT_METHODS, FUND_NAMES } from '../../utils/mockData'
import { useFinance } from '../../contexts/FinanceContext'

const emptyForm = {
  memberName: '', category: 'Tithe', amount: '', paymentMethod: 'Cash',
  date: new Date().toISOString().split('T')[0], description: '', fund: 'General Fund',
}

export default function IncomeFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const { members } = useFinance()
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
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Income Record' : 'Record New Income'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Member Name</label>
            <input
              list="member-suggestions"
              name="memberName"
              className="input-field"
              placeholder="Type or select member"
              value={form.memberName}
              onChange={handleChange}
              required
            />
            <datalist id="member-suggestions">
              {members.map(m => <option key={m.id} value={m.name} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="input-field" value={form.category} onChange={handleChange}>
              {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
            <label className="label">Payment Method</label>
            <select name="paymentMethod" className="input-field" value={form.paymentMethod} onChange={handleChange}>
              {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
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
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            name="description" rows={2} className="input-field resize-none"
            placeholder="Optional notes about this transaction"
            value={form.description} onChange={handleChange}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{initialData ? 'Save Changes' : 'Record Income'}</button>
        </div>
      </form>
    </Modal>
  )
}
