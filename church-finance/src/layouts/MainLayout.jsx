import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useFinance } from '../contexts/FinanceContext'
import { CHURCH_NAME, CHURCH_SHORT } from '../utils/mockData'
import NotificationDropdown from '../components/common/NotificationDropdown'
import GlobalSearch from '../components/common/GlobalSearch'
import {
  LayoutDashboard, TrendingUp, TrendingDown, Wallet, Users, FileText,
  Phone, ClipboardList, Menu, X, LogOut, ChevronDown, Bell, Settings,
  Church, Sun, Moon, Search, Building2, Package, Users2, Megaphone,
  GitBranch, Calendar, ChevronRight, MessageSquare, FolderOpen, UserCheck
} from 'lucide-react'
import clsx from 'clsx'

const navSections = [
  {
    label: 'Main Menu',
    items: [
      { path: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard, permission: 'view_dashboard' },
      { path: '/income',    label: 'Income',        icon: TrendingUp,      permission: 'view_income'   },
      { path: '/expenses',  label: 'Expenses',      icon: TrendingDown,    permission: 'view_expense'  },
      { path: '/funds',     label: 'Fund Accounts', icon: Wallet,          permission: 'view_funds'    },
      { path: '/members',   label: 'Members',       icon: Users,           permission: 'view_members'  },
      { path: '/mpesa',     label: 'M-Pesa',        icon: Phone,           permission: 'mpesa'         },
    ],
  },
  {
    label: 'Management',
    items: [
      { path: '/budget',        label: 'Budget',        icon: Wallet,     permission: 'manage_budget'      },
      { path: '/events',        label: 'Events',        icon: Calendar,   permission: 'view_events'        },
      { path: '/attendance',    label: 'Attendance',    icon: UserCheck,  permission: 'view_attendance'    },
      { path: '/assets',        label: 'Assets',        icon: Package,    permission: 'manage_assets'      },
      { path: '/payroll',       label: 'Payroll',       icon: Users2,     permission: 'manage_payroll'     },
      { path: '/branches',      label: 'Branches',      icon: GitBranch,  permission: 'manage_branches'    },
      { path: '/announcements', label: 'Announcements', icon: Megaphone,  permission: 'manage_announcements'},
      { path: '/documents',     label: 'Documents',     icon: FolderOpen, permission: 'manage_documents'   },
    ],
  },
  {
    label: 'Reports & Admin',
    items: [
      { path: '/reports',       label: 'Reports',        icon: FileText,      permission: 'view_reports'        },
      { path: '/audit',         label: 'Audit Logs',     icon: ClipboardList, permission: 'audit'               },
      { path: '/communication', label: 'Communications', icon: MessageSquare, permission: 'manage_communications'},
      { path: '/notifications', label: 'Notifications',  icon: Bell,          permission: 'view_notifications'  },
      { path: '/settings',      label: 'Settings',       icon: Settings,      permission: 'manage_settings'     },
      { path: '/backup',        label: 'Backup',         icon: Building2,     permission: 'manage_backup'       },
    ],
  },
]

export default function MainLayout({ children }) {
  const { user, logout, can, darkMode, toggleDarkMode } = useAuth()
  const { unreadNotifications } = useFinance()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const currentPageLabel = () => {
    const path = location.pathname
    for (const section of navSections) {
      const item = section.items.find(i => i.path === path)
      if (item) return item.label
    }
    return path.slice(1) || 'Dashboard'
  }

  const Sidebar = ({ mobile = false }) => (
    <div className={clsx('flex flex-col h-full', mobile ? 'w-72' : 'w-64')}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-gold-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Church className="w-5 h-5 text-brand-950" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm leading-tight truncate">{CHURCH_SHORT}</div>
          <div className="text-brand-300 text-xs truncate">Finance System</div>
        </div>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {navSections.map(section => {
          const visibleItems = section.items.filter(item =>
            !item.permission || can(item.permission)
          )
          if (visibleItems.length === 0) return null
          return (
            <div key={section.label}>
              <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider px-3 mb-2">{section.label}</p>
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const Icon = item.icon
                  const active = location.pathname === item.path
                  const isNotif = item.path === '/notifications'
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx('sidebar-link relative', active ? 'sidebar-link-active' : 'sidebar-link-inactive')}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                      {isNotif && unreadNotifications > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                      {active && !isNotif && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold-400" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.avatar || (user?.name?.split(' ').map(n => n[0]).slice(0,2).join('') || '?')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name}</div>
            <div className={clsx('text-xs capitalize font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5',
              user?.role === 'administrator' ? 'bg-gold-500/30 text-gold-300' :
              user?.role === 'treasurer'     ? 'bg-green-500/30 text-green-300' :
              user?.role === 'pastor'        ? 'bg-purple-500/30 text-purple-300' :
              'text-brand-300'
            )}>
              {user?.role}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-2 sidebar-link sidebar-link-inactive justify-center text-red-300 hover:text-red-200 hover:bg-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col bg-brand-950 w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full bg-brand-950 z-10">
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 lg:px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize truncate">
              {currentPageLabel()}
            </h1>
            <p className="text-xs text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Global search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hidden sm:flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs text-gray-400 hidden md:inline">Search...</span>
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5 w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false) }}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                <Bell className="w-[18px] h-[18px]" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} />}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false) }}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight">{user?.name?.split(' ')[0]}</div>
                  <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20">
                  <div className="px-3 py-2 border-b border-gray-50 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 fade-in">
          {children}
        </main>
      </div>

      {/* Global search overlay */}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </div>
  )
}
