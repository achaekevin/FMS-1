import { useState, useEffect } from 'react'
import Modal from '../common/Modal'

const emptyForm = { name: '', phone: '', email: '' }

export default function MemberFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setForm(initialData ? { name: initialData.name, phone: initialData.phone, email: initialData.email } : emptyForm)
  }, [initialData, isOpen])

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Member' : 'Add New Member'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input
            type="text" name="name" className="input-field"
            placeholder="e.g. Jane Wanjiru"
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
          <label className="label">Email Address</label>
          <input
            type="email" name="email" className="input-field"
            placeholder="jane@email.com"
            value={form.email} onChange={handleChange}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary">{initialData ? 'Save Changes' : 'Add Member'}</button>
        </div>
      </form>
    </Modal>
  )
}
