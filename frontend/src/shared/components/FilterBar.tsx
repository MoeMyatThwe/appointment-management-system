import type { ReactNode } from 'react'

interface FilterBarProps {
  children: ReactNode
  onClear?: () => void
}

export function FilterBar({ children, onClear }: FilterBarProps) {
  return (
    <div className="mb-4 grid min-w-0 gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-3">
      {children}
      {onClear ? (
        <button
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          type="button"
          onClick={onClear}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  )
}
