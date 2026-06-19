import { createContext, useContext, useState, useCallback } from 'react'
import {
  INCOME_TRANSACTIONS, EXPENSE_TRANSACTIONS, MEMBERS,
  MPESA_TRANSACTIONS, AUDIT_LOGS, FUNDS, BUDGETS, EVENTS,
  ASSETS, EMPLOYEES, PAYROLL, BRANCHES, ANNOUNCEMENTS, NOTIFICATIONS,
  CHURCH_NAME, CHURCH_ADDRESS, CHURCH_PHONE, CHURCH_EMAIL,
  CHURCH_CURRENCY, CHURCH_FISCAL_YEAR
} from '../utils/mockData'

const FinanceContext = createContext(null)

export const useFinance = () => {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}

export const FinanceProvider = ({ children }) => {
  const [income, setIncome] = useState(INCOME_TRANSACTIONS)
  const [expenses, setExpenses] = useState(EXPENSE_TRANSACTIONS)
  const [members, setMembers] = useState(MEMBERS)
  const [mpesa, setMpesa] = useState(MPESA_TRANSACTIONS)
  const [logs, setLogs] = useState(AUDIT_LOGS)
  const [funds, setFunds] = useState(FUNDS)
  const [budgets, setBudgets] = useState(BUDGETS)
  const [events, setEvents] = useState(EVENTS)
  const [assets, setAssets] = useState(ASSETS)
  const [employees, setEmployees] = useState(EMPLOYEES)
  const [payroll, setPayroll] = useState(PAYROLL)
  const [branches, setBranches] = useState(BRANCHES)
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS)
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const [settings, setSettings] = useState({
    churchName: CHURCH_NAME, address: CHURCH_ADDRESS,
    phone: CHURCH_PHONE, email: CHURCH_EMAIL,
    currency: CHURCH_CURRENCY, fiscalYear: CHURCH_FISCAL_YEAR,
    logo: null,
  })

  // ── Audit log ────────────────────────────────────────────
  const addLog = useCallback((user, action, type = 'create', module = 'General') => {
    const entry = {
      id: Date.now(),
      user: user?.name || 'System',
      action, type, module,
      timestamp: new Date().toISOString(),
    }
    setLogs(prev => [entry, ...prev])
    // Also push a notification for key actions
    const notifTypes = { delete: 'error', auth: 'info', mpesa: 'success', create: 'success', approve: 'success', export: 'info', update: 'info' }
    addNotification(action, notifTypes[type] || 'info', module)
  }, [])

  const addNotification = useCallback((message, type = 'info', module = 'System') => {
    const n = {
      id: Date.now() + Math.random(),
      message, type, module,
      read: false,
      timestamp: new Date().toISOString(),
    }
    setNotifications(prev => [n, ...prev].slice(0, 50))
  }, [])

  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  // ── Income ───────────────────────────────────────────────
  const addIncome = useCallback((record, user) => {
    const entry = { id: Date.now(), ...record }
    setIncome(prev => [entry, ...prev])
    addLog(user, `Recorded income: ${record.category} - KES ${record.amount} from ${record.memberName}`, 'create', 'Income')
  }, [addLog])

  const updateIncome = useCallback((id, record, user) => {
    setIncome(prev => prev.map(i => i.id === id ? { ...i, ...record } : i))
    addLog(user, `Updated income record #${id}`, 'update', 'Income')
  }, [addLog])

  const deleteIncome = useCallback((id, user) => {
    setIncome(prev => prev.filter(i => i.id !== id))
    addLog(user, `Deleted income record #${id}`, 'delete', 'Income')
  }, [addLog])

  // ── Expenses ─────────────────────────────────────────────
  const addExpense = useCallback((record, user) => {
    const entry = { id: Date.now(), ...record }
    setExpenses(prev => [entry, ...prev])
    addLog(user, `Recorded expense: ${record.category} - KES ${record.amount}`, 'create', 'Expenses')
  }, [addLog])

  const updateExpense = useCallback((id, record, user) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...record } : e))
    addLog(user, `Updated expense record #${id}`, 'update', 'Expenses')
  }, [addLog])

  const deleteExpense = useCallback((id, user) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
    addLog(user, `Deleted expense record #${id}`, 'delete', 'Expenses')
  }, [addLog])

  // ── Members ──────────────────────────────────────────────
  const addMember = useCallback((member, user) => {
    const entry = { id: Date.now(), totalContributions: 0, joinDate: new Date().toISOString().split('T')[0], ...member }
    setMembers(prev => [...prev, entry])
    addLog(user, `Added new member: ${member.name}`, 'create', 'Members')
  }, [addLog])

  const updateMember = useCallback((id, member, user) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...member } : m))
    addLog(user, `Updated member: ${member.name}`, 'update', 'Members')
  }, [addLog])

  const deleteMember = useCallback((id, name, user) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    addLog(user, `Deleted member: ${name}`, 'delete', 'Members')
  }, [addLog])

  // ── M-Pesa ───────────────────────────────────────────────
  const initiateMpesa = useCallback((data, user) => {
    const tx = {
      id: Date.now(), ...data, status: 'pending',
      reference: 'Q' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      timestamp: new Date().toISOString(),
    }
    setMpesa(prev => [tx, ...prev])
    addLog(user, `Initiated M-Pesa STK Push to ${data.phone} - KES ${data.amount}`, 'mpesa', 'M-Pesa')
    setTimeout(() => {
      setMpesa(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'completed' } : t))
    }, 3000)
    return tx
  }, [addLog])

  // ── Budgets ──────────────────────────────────────────────
  const addBudget = useCallback((budget, user) => {
    const entry = { id: Date.now(), createdAt: new Date().toISOString(), ...budget }
    setBudgets(prev => [entry, ...prev])
    addLog(user, `Created budget: ${budget.name}`, 'create', 'Budget')
  }, [addLog])

  const updateBudget = useCallback((id, budget, user) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...budget } : b))
    addLog(user, `Updated budget: ${budget.name}`, 'update', 'Budget')
  }, [addLog])

  const deleteBudget = useCallback((id, name, user) => {
    setBudgets(prev => prev.filter(b => b.id !== id))
    addLog(user, `Deleted budget: ${name}`, 'delete', 'Budget')
  }, [addLog])

  // ── Events ───────────────────────────────────────────────
  const addEvent = useCallback((event, user) => {
    const entry = { id: Date.now(), createdAt: new Date().toISOString(), ...event }
    setEvents(prev => [entry, ...prev])
    addLog(user, `Created event: ${event.title}`, 'create', 'Events')
  }, [addLog])

  const updateEvent = useCallback((id, event, user) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...event } : e))
    addLog(user, `Updated event: ${event.title}`, 'update', 'Events')
  }, [addLog])

  const deleteEvent = useCallback((id, title, user) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    addLog(user, `Deleted event: ${title}`, 'delete', 'Events')
  }, [addLog])

  // ── Assets ───────────────────────────────────────────────
  const addAsset = useCallback((asset, user) => {
    const entry = { id: Date.now(), createdAt: new Date().toISOString(), ...asset }
    setAssets(prev => [entry, ...prev])
    addLog(user, `Added asset: ${asset.name}`, 'create', 'Assets')
  }, [addLog])

  const updateAsset = useCallback((id, asset, user) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, ...asset } : a))
    addLog(user, `Updated asset: ${asset.name}`, 'update', 'Assets')
  }, [addLog])

  const deleteAsset = useCallback((id, name, user) => {
    setAssets(prev => prev.filter(a => a.id !== id))
    addLog(user, `Deleted asset: ${name}`, 'delete', 'Assets')
  }, [addLog])

  // ── Employees / Payroll ──────────────────────────────────
  const addEmployee = useCallback((emp, user) => {
    const entry = { id: Date.now(), createdAt: new Date().toISOString(), ...emp }
    setEmployees(prev => [entry, ...prev])
    addLog(user, `Added employee: ${emp.name}`, 'create', 'Payroll')
  }, [addLog])

  const updateEmployee = useCallback((id, emp, user) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...emp } : e))
    addLog(user, `Updated employee: ${emp.name}`, 'update', 'Payroll')
  }, [addLog])

  const deleteEmployee = useCallback((id, name, user) => {
    setEmployees(prev => prev.filter(e => e.id !== id))
    addLog(user, `Deleted employee: ${name}`, 'delete', 'Payroll')
  }, [addLog])

  const addPayslip = useCallback((slip, user) => {
    const entry = { id: Date.now(), issuedAt: new Date().toISOString(), ...slip }
    setPayroll(prev => [entry, ...prev])
    addLog(user, `Issued payslip for ${slip.employeeName} - ${slip.month}`, 'create', 'Payroll')
  }, [addLog])

  // ── Announcements ────────────────────────────────────────
  const addAnnouncement = useCallback((ann, user) => {
    const entry = { id: Date.now(), createdAt: new Date().toISOString(), author: user?.name || 'Admin', ...ann }
    setAnnouncements(prev => [entry, ...prev])
    addLog(user, `Posted announcement: ${ann.title}`, 'create', 'Announcements')
  }, [addLog])

  const updateAnnouncement = useCallback((id, ann, user) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...ann } : a))
    addLog(user, `Updated announcement: ${ann.title}`, 'update', 'Announcements')
  }, [addLog])

  const deleteAnnouncement = useCallback((id, title, user) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id))
    addLog(user, `Deleted announcement: ${title}`, 'delete', 'Announcements')
  }, [addLog])

  // ── Settings ─────────────────────────────────────────────
  const updateSettings = useCallback((newSettings, user) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    addLog(user, 'Updated church settings', 'update', 'Settings')
  }, [addLog])

  // ── Derived ──────────────────────────────────────────────
  const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const netBalance = totalIncome - totalExpenses
  const totalTithes = income.filter(i => i.category === 'Tithe').reduce((s, i) => s + Number(i.amount), 0)
  const totalDonations = income.filter(i => i.category === 'Donation').reduce((s, i) => s + Number(i.amount), 0)
  const unreadNotifications = notifications.filter(n => !n.read).length

  return (
    <FinanceContext.Provider value={{
      income, expenses, members, mpesa, logs, funds,
      budgets, events, assets, employees, payroll,
      branches, announcements, notifications, unreadNotifications, settings,
      totalIncome, totalExpenses, netBalance, totalTithes, totalDonations,
      addIncome, updateIncome, deleteIncome,
      addExpense, updateExpense, deleteExpense,
      addMember, updateMember, deleteMember,
      initiateMpesa, addLog,
      addBudget, updateBudget, deleteBudget,
      addEvent, updateEvent, deleteEvent,
      addAsset, updateAsset, deleteAsset,
      addEmployee, updateEmployee, deleteEmployee, addPayslip,
      addAnnouncement, updateAnnouncement, deleteAnnouncement,
      updateSettings, addNotification, markNotificationRead, markAllNotificationsRead,
    }}>
      {children}
    </FinanceContext.Provider>
  )
}
