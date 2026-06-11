import { useContext } from 'react'
import { ToastContext } from '../context/toast.js'

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Graceful fallback if used outside ToastProvider
    return { showToast: (msg, type) => console.warn('[Toast]', type, msg) }
  }
  return context
}
