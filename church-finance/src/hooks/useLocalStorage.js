import { useState, useCallback } from 'react'

/**
 * useState that persists its value to localStorage.
 *
 * - On first load: reads from localStorage if the key exists,
 *   otherwise falls back to `initialValue` (which can be a value or a factory function).
 * - On every set: writes the new value to localStorage.
 * - Gracefully falls back to plain useState if localStorage is unavailable.
 *
 * @param {string} key           localStorage key
 * @param {*}      initialValue  default value (or factory function)
 */
export default function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      if (item !== null) return JSON.parse(item)
    } catch {}
    return typeof initialValue === 'function' ? initialValue() : initialValue
  })

  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      const next = typeof value === 'function' ? value(prev) : value
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [key])

  return [storedValue, setValue]
}
