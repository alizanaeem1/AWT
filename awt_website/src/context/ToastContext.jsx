import { useCallback, useMemo, useState } from 'react'
import { ToastContext } from './toast.js'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 3200)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[80] space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={[
              'w-80 rounded-lg border px-4 py-3 text-sm font-semibold shadow-xl',
              toast.type === 'error'
                ? 'border-red-400/30 bg-red-950 text-red-100'
                : 'border-emerald-400/30 bg-emerald-950 text-emerald-100'
            ].join(' ')}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
