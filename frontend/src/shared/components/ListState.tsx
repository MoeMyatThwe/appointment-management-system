import type { ReactNode } from 'react'

interface ListStateProps {
  loading: boolean
  error: boolean
  empty: boolean
  loadingMessage: string
  emptyMessage: string
  children: ReactNode
}

export function ListState({
  loading,
  error,
  empty,
  loadingMessage,
  emptyMessage,
  children,
}: ListStateProps) {
  if (loading) {
    return <p className="text-sm text-slate-500">{loadingMessage}</p>
  }

  if (error) {
    return (
      <p className="rounded-xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
        Unable to load this list. Please try again.
      </p>
    )
  }

  if (empty) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    )
  }

  return <>{children}</>
}
