import { useState, useMemo } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../utils/mockData'
import { generateReceipt } from '../utils/exportUtils'
import { Plus, Pencil, Trash2, Users2, DollarSign, FileDown, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { CHURCH_NAME } from '../utils/mockData'

const DEPARTMENTS = ['Administration', 'Worship', 'Youth', 'Children', 'Ushering', 'Security', 'Cleaning', 'Other']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const emptyEmp = { name: '', role: '', department: 'Administration', phone: '', email: '', basicSalary: '', hireDate: new Date().toISOString().split('T')[0] }
const emptySlip = { employeeId: '', employeeName: '', month: MONTHS[new Date().getMonth()], year: new Date().getFullYear(), basicSalary: '', allowances: '', deductions: '' }

function EmployeeFormModal({ isOpen, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyEmp)
  useState(() => { setForm(initialData ? { ...initialData } : emptyEmp) }, [initialData, isOpen])
  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({ ...form, basicSalary: Number(form.basicSalary) })
    onClose()
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Employee' : 'Add Employee'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="label">Full Name</label><input name="name" className="input-field" placeholder="Full name" value={form.name} onChange={handleChange} required /></div>
          <div><label className="label">Role/Position</label><input name="role" className="input-field" placeholder="e.g. Church Secretary" value={form.role} onChange={handleChange} required /></div>
          <div><label className="label">Department</label><select name="department" className="input-field" value={form.department} onChange={handleChange}>{DEPARTMENTS.map(d => <option key={d}>{d}</option>)}</select></div>
          <div><label className="label">Phone</label><input name="phone" className="input-field" placeholder="07XXXXXXXX" value={form.phone} onChange={handleChange} /></div>
          <div><label className="label">Email</label><input type="email" name="email" className="input-field" placeholder="email@example.com" value={form.email} onChange={handleChange} /></div>
          <div><label className="label">Basic Salary (KES)</label><input type="number" name="basicSalary" min="0" className="input-field" placeholder="0.00" value={form.basicSalary} onChange={handleChange} required /></div>
          <div><label className="label">Hire Date</label><input type="date" name="hireDate" className="input-field" value={form.hireDate} onChange={handleChange} /></div>
        </div>
        <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">{initialData ? 'Save Changes' : 'Add Employee'}</button></div>
      </form>
    </Modal>
  )
}

function PayslipFormModal({ isOpen, onClose, onSubmit, employees }) {
  const [form, setForm] = useState(emptySlip)
  const handleChange = e => {
    const { name, value } = e.target
    if (name === 'employeeId') {
      const emp = employees.find(e => String(e.id) === value)
      setForm(p => ({ ...p, employeeId: value, employeeName: emp?.name || '', basicSalary: emp?.basicSalary || '' }))
    } else {
      setForm(p => ({ ...p, [name]: value }))
    }
  }
  const net = (Number(form.basicSalary) || 0) + (Number(form.allowances) || 0) - (Number(form.deductions) || 0)
  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({ ...form, basicSalary: Number(form.basicSalary), allowances: Number(form.allowances) || 0, deductions: Number(form.deductions) || 0, netSalary: net })
    onClose()
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Issue Payslip" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Employee</label>
            <select name="employeeId" className="input-field" value={form.employeeId} onChange={handleChange} required>
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
            </select>
          </div>
          <div><label className="label">Month</label><select name="month" className="input-field" value={form.month} onChange={handleChange}>{MONTHS.map(m => <option key={m}>{m}</option>)}</select></div>
          <div><label className="label">Year</label><input type="number" name="year" className="input-field" value={form.year} onChange={handleChange} required /></div>
          <div><label className="label">Basic Salary (KES)</label><input type="number" name="basicSalary" min="0" className="input-field" value={form.basicSalary} onChange={handleChange} required /></div>
          <div><label className="label">Allowances (KES)</label><input type="number" name="allowances" min="0" className="input-field" placeholder="0" value={form.allowances} onChange={handleChange} /></div>
          <div><label className="label">Deductions (KES)</label><input type="number" name="deductions" min="0" className="input-field" placeholder="0" value={form.deductions} onChange={handleChange} /></div>
          <div className="flex items-end">
            <div className="w-full p-3 bg-brand-50 dark:bg-brand-900/30 rounded-xl">
              <p className="text-xs text-gray-500 dark:text-gray-400">Net Salary</p>
              <p className="text-xl font-bold text-brand-700 dark:text-brand-300">{formatCurrency(net)}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Issue Payslip</button></div>
      </form>
    </Modal>
  )
}

const downloadPayslipPDF = (slip) => {
  import('jspdf').then(({ default: jsPDF }) => {
    const doc = new jsPDF({ format: 'a5' })
    doc.setFillColor(79, 79, 232)
    doc.rect(0, 0, 148, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(13)
    doc.text(CHURCH_NAME, 10, 11)
    doc.setFontSize(9)
    doc.text('PAYSLIP', 10, 20)
    doc.text(`${slip.month} ${slip.year}`, 100, 20)

    doc.setTextColor(30, 30, 30)
    doc.setFontSize(10)
    doc.text(`Employee: ${slip.employeeName}`, 10, 40)
    doc.text(`Period: ${slip.month} ${slip.year}`, 10, 48)
    doc.setDrawColor(220, 220, 220)
    doc.line(10, 53, 138, 53)

    const rows = [
      ['Basic Salary', formatCurrency(slip.basicSalary)],
      ['Allowances', formatCurrency(slip.allowances)],
      ['Deductions', `- ${formatCurrency(slip.deductions)}`],
    ]
    let y = 62
    rows.forEach(([label, val]) => {
      doc.setFont(undefined, 'normal')
      doc.text(label, 10, y)
      doc.text(val, 138, y, { align: 'right' })
      y += 9
    })
    doc.line(10, y, 138, y)
    y += 8
    doc.setFont(undefined, 'bold')
    doc.setFontSize(11)
    doc.text('Net Salary', 10, y)
    doc.text(formatCurrency(slip.netSalary), 138, y, { align: 'right' })

    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.setFont(undefined, 'normal')
    doc.text('Computer-generated payslip. No signature required.', 74, 200, { align: 'center' })
    doc.save(`payslip-${slip.employeeName.replace(/\s+/g, '-')}-${slip.month}-${slip.year}.pdf`)
  })
}

export default function Payroll() {
  const { employees, payroll, addEmployee, updateEmployee, deleteEmployee, addPayslip } = useFinance()
  const { user } = useAuth()
  const [tab, setTab] = useState('employees')
  const [empModal, setEmpModal] = useState(false)
  const [slipModal, setSlipModal] = useState(false)
  const [editEmp, setEditEmp] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')

  const filteredEmps = useMemo(() => employees.filter(e => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase())), [employees, search])
  const totalPayroll = employees.reduce((s, e) => s + Number(e.basicSalary), 0)

  const handleSaveEmp = (data) => {
    if (editEmp) { updateEmployee(editEmp.id, data, user); toast.success('Employee updated') }
    else { addEmployee(data, user); toast.success('Employee added') }
    setEditEmp(null)
  }
  const handleDeleteEmp = () => {
    const e = employees.find(x => x.id === deleteId)
    deleteEmployee(deleteId, e?.name, user)
    toast.success('Employee removed')
    setDeleteId(null)
  }
  const handleIssueSlip = (data) => {
    addPayslip(data, user)
    toast.success('Payslip issued')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Payroll Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage employees and issue payslips</p>
        </div>
        <div className="flex gap-2">
          {tab === 'employees' ? (
            <button onClick={() => { setEditEmp(null); setEmpModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> Add Employee</button>
          ) : (
            <button onClick={() => setSlipModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Issue Payslip</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center"><Users2 className="w-5 h-5 text-purple-600" /></div><div><p className="text-xs text-gray-400">Total Employees</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{employees.length}</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div><div><p className="text-xs text-gray-400">Monthly Payroll</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalPayroll)}</p></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center"><FileDown className="w-5 h-5 text-brand-600" /></div><div><p className="text-xs text-gray-400">Payslips Issued</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{payroll.length}</p></div></div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {['employees', 'payslips'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={clsx('px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px', tab === t ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400')}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'employees' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input className="input-field pl-9" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="table-header">Employee</th><th className="table-header">Role</th><th className="table-header hidden md:table-cell">Department</th><th className="table-header hidden lg:table-cell">Phone</th><th className="table-header text-right">Basic Salary</th><th className="table-header text-right">Actions</th></tr></thead>
              <tbody>
                {filteredEmps.length === 0 && <tr><td colSpan={6} className="table-cell text-center text-gray-400 py-8">No employees yet</td></tr>}
                {filteredEmps.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="table-cell"><div><p className="font-medium text-gray-800 dark:text-gray-100">{e.name}</p><p className="text-xs text-gray-400">{e.email}</p></div></td>
                    <td className="table-cell text-gray-600 dark:text-gray-300">{e.role}</td>
                    <td className="table-cell hidden md:table-cell"><span className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{e.department}</span></td>
                    <td className="table-cell hidden lg:table-cell text-gray-500 dark:text-gray-400">{e.phone}</td>
                    <td className="table-cell text-right font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(e.basicSalary)}</td>
                    <td className="table-cell text-right"><div className="flex justify-end gap-1"><button onClick={() => { setEditEmp(e); setEmpModal(true) }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'payslips' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr><th className="table-header">Employee</th><th className="table-header">Period</th><th className="table-header hidden md:table-cell">Basic Salary</th><th className="table-header hidden md:table-cell">Allowances</th><th className="table-header hidden md:table-cell">Deductions</th><th className="table-header text-right">Net Salary</th><th className="table-header text-right">PDF</th></tr></thead>
              <tbody>
                {payroll.length === 0 && <tr><td colSpan={7} className="table-cell text-center text-gray-400 py-8">No payslips issued yet</td></tr>}
                {payroll.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="table-cell font-medium text-gray-800 dark:text-gray-100">{s.employeeName}</td>
                    <td className="table-cell text-gray-500 dark:text-gray-400">{s.month} {s.year}</td>
                    <td className="table-cell hidden md:table-cell text-gray-600 dark:text-gray-300">{formatCurrency(s.basicSalary)}</td>
                    <td className="table-cell hidden md:table-cell text-green-600">+{formatCurrency(s.allowances)}</td>
                    <td className="table-cell hidden md:table-cell text-red-500">-{formatCurrency(s.deductions)}</td>
                    <td className="table-cell text-right font-bold text-brand-700 dark:text-brand-300">{formatCurrency(s.netSalary)}</td>
                    <td className="table-cell text-right"><button onClick={() => downloadPayslipPDF(s)} className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-600"><FileDown className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EmployeeFormModal isOpen={empModal} onClose={() => { setEmpModal(false); setEditEmp(null) }} onSubmit={handleSaveEmp} initialData={editEmp} />
      <PayslipFormModal isOpen={slipModal} onClose={() => setSlipModal(false)} onSubmit={handleIssueSlip} employees={employees} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDeleteEmp} title="Remove Employee?" message="This will permanently remove the employee record." />
    </div>
  )
}
