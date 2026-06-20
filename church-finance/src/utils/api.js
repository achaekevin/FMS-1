/**
 * Axios instance pre-configured for the church-finance backend.
 * Attach JWT from sessionStorage automatically on every request.
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
})

// Attach auth token if present
api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(sessionStorage.getItem('glc_user') || '{}')
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`
    }
  } catch {}
  return config
})

// Normalise error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Request failed'
    return Promise.reject(new Error(message))
  }
)

export default api
