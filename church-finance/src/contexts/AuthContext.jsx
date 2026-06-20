import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { USERS } from '../utils/mockData'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('glc_dark_mode') === 'true' } catch { return false }
  })

  useEffect(() => {
    const stored = sessionStorage.getItem('glc_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else          document.documentElement.classList.remove('dark')
    localStorage.setItem('glc_dark_mode', String(darkMode))
  }, [darkMode])

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await axios.post(`${BASE}/auth/login`, { email, password })
      const safeUser = { ...data.data.user, token: data.data.token }
      setUser(safeUser)
      sessionStorage.setItem('glc_user', JSON.stringify(safeUser))
      return safeUser
    } catch (backendErr) {
      const msg = backendErr.response?.data?.message
      if (backendErr.response) throw new Error(msg || 'Invalid email or password')

      // Network error — mock fallback (staff only)
      await new Promise(r => setTimeout(r, 600))
      const found = USERS.find(u => u.email === email && u.password === password)
      if (!found) throw new Error('Invalid email or password')
      const { password: _, ...safeUser } = found
      setUser(safeUser)
      sessionStorage.setItem('glc_user', JSON.stringify(safeUser))
      return safeUser
    }
  }, [])

  // ── Register ──────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password, role }) => {
    const { data } = await axios.post(`${BASE}/auth/register`, { name, email, password, role })
    const safeUser = { ...data.data.user, token: data.data.token }
    setUser(safeUser)
    sessionStorage.setItem('glc_user', JSON.stringify(safeUser))
    return safeUser
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('glc_user')
    toast.success('Logged out successfully')
  }, [])

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), [])

  const can = useCallback((permission) => {
    if (!user) return false
    const perms = {
      administrator: ['all'],
      pastor:    ['view_dashboard','view_income','view_expense','view_members','view_reports','view_funds','approve_expense'],
      treasurer: ['view_dashboard','manage_income','manage_expense','view_members','view_reports','view_funds','export','mpesa','audit'],
    }
    const userPerms = perms[user.role] || []
    return userPerms.includes('all') || userPerms.includes(permission)
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, can, darkMode, toggleDarkMode,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
