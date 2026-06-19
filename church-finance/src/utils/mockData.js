// ──────────────────────────────────────────────────────────
// Grace Life Church Financial Management System — Data Store
// ──────────────────────────────────────────────────────────

export const CHURCH_NAME = 'Grace Life Church'
export const CHURCH_SHORT = 'GLC'
export const CHURCH_TAGLINE = 'Finance Management System'
export const CHURCH_ADDRESS = 'Nairobi, Kenya'
export const CHURCH_PHONE = '+254 700 000 000'
export const CHURCH_EMAIL = 'finance@gracelifechurch.org'
export const CHURCH_CURRENCY = 'KES'
export const CHURCH_FISCAL_YEAR = 'January - December'

export const USERS = [
  { id: 1, name: 'David Kamau', email: 'admin@gracelife.org', password: 'GLC@Admin2024!', role: 'administrator', avatar: 'DK' },
  { id: 2, name: 'Rev. James Mwangi', email: 'pastor@gracelife.org', password: 'GLC@Pastor2024!', role: 'pastor', avatar: 'JM' },
  { id: 3, name: 'Sarah Achieng', email: 'treasurer@gracelife.org', password: 'GLC@Treasurer2024!', role: 'treasurer', avatar: 'SA' },
]

export const MEMBERS = []
export const INCOME_TRANSACTIONS = []
export const EXPENSE_TRANSACTIONS = []

export const FUNDS = [
  { id: 1, name: 'General Fund', description: 'Day-to-day church operations', balance: 0, color: 'blue', totalIncome: 0, totalExpenses: 0 },
  { id: 2, name: 'Building Fund', description: 'Construction and maintenance', balance: 0, color: 'green', totalIncome: 0, totalExpenses: 0 },
  { id: 3, name: 'Welfare Fund', description: 'Member and community support', balance: 0, color: 'purple', totalIncome: 0, totalExpenses: 0 },
  { id: 4, name: 'Mission Fund', description: 'Evangelism and outreach', balance: 0, color: 'orange', totalIncome: 0, totalExpenses: 0 },
]

export const MONTHLY_DATA = []
export const CONTRIBUTION_TRENDS = []
export const AUDIT_LOGS = []
export const MPESA_TRANSACTIONS = []

export const BUDGETS = []
export const EVENTS = []
export const ASSETS = []
export const PAYROLL = []
export const EMPLOYEES = []
export const BRANCHES = [
  { id: 1, name: 'Main Branch', location: 'Nairobi CBD', pastor: 'Rev. James Mwangi', members: 0, isMain: true },
  { id: 2, name: 'Westlands Branch', location: 'Westlands, Nairobi', pastor: 'Rev. Peter Odhiambo', members: 0 },
  { id: 3, name: 'Thika Road Branch', location: 'Thika Road, Nairobi', pastor: 'Rev. Grace Wanjiku', members: 0 },
]
export const ANNOUNCEMENTS = []
export const NOTIFICATIONS = []

export const INCOME_CATEGORIES = ['Tithe', 'Offering', 'Donation', 'Building Fund', 'Mission Offering', 'Welfare', 'Special Collection', 'Other']
export const EXPENSE_CATEGORIES = ['Salaries', 'Utilities', 'Maintenance', 'Ministry', 'Welfare', 'Missions', 'Equipment', 'Stationery', 'Transport', 'Other']
export const PAYMENT_METHODS = ['Cash', 'M-Pesa', 'Bank Transfer', 'Cheque']
export const FUND_NAMES = ['General Fund', 'Building Fund', 'Welfare Fund', 'Mission Fund']

export const ASSET_CATEGORIES = ['Land & Buildings', 'Vehicles', 'Electronics', 'Furniture', 'Musical Instruments', 'Other']
export const ASSET_CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Disposed']
export const EVENT_TYPES = ['Conference', 'Crusade', 'Fundraiser', 'Meeting', 'Service', 'Outreach', 'Training', 'Other']

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount)

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })

export const formatRelativeTime = (timestamp) => {
  const now = new Date()
  const then = new Date(timestamp)
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(timestamp)
}
