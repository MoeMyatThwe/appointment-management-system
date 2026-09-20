import type { ReactNode } from 'react'
import { FiAlertCircle, FiLoader, FiRefreshCw } from 'react-icons/fi'

interface ListStateProps {
  loading: boolean
  error: boolean
  empty: boolean
  loadingMessage: string
  emptyMessage: string
  onRetry?: () => void
  children: ReactNode
}

export function ListState({
  loading,
  error,
  empty,
  loadingMessage,
  emptyMessage,
  onRetry,
  children,
}: ListStateProps) {
  if (loading) {
    return <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-500"><FiLoader className="animate-spin" aria-hidden="true" />{loadingMessage}</div>
  }

  if (error) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-xl bg-rose-50 px-4 py-4 text-sm text-rose-700"><span className="flex items-center gap-2"><FiAlertCircle aria-hidden="true" />Unable to load this list. Please try again.</span>{onRetry ? <button className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 font-semibold hover:bg-rose-100" type="button" onClick={onRetry}><FiRefreshCw aria-hidden="true" />Retry</button> : null}</div>
    )
  }

  if (empty) {
    return (
      <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    )
  }

  return <>{children}</>
}
