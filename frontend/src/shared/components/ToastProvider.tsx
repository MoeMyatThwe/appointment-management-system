import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { FiCheckCircle, FiInfo, FiX, FiXCircle } from 'react-icons/fi'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, tone }])
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return <ToastContext.Provider value={value}>
    {children}
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] grid justify-items-end gap-2 sm:left-auto sm:w-96" aria-live="polite">
      {toasts.map((toast) => <div className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : toast.tone === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-indigo-200 bg-indigo-50 text-indigo-800'}`} role="status" key={toast.id}>
        {toast.tone === 'success' ? <FiCheckCircle className="mt-0.5 shrink-0" aria-hidden="true" /> : toast.tone === 'error' ? <FiXCircle className="mt-0.5 shrink-0" aria-hidden="true" /> : <FiInfo className="mt-0.5 shrink-0" aria-hidden="true" />}
        <span className="flex-1">{toast.message}</span>
        <button className="shrink-0 opacity-70 hover:opacity-100" type="button" aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}><FiX aria-hidden="true" /></button>
      </div>)}
    </div>
  </ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
