import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: ReactNode
}

export function FormField({ label, htmlFor, hint, error, children }: FormFieldProps) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700" htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
      {hint && !error ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
      {error ? <span className="text-xs font-medium text-rose-600" role="alert">{error}</span> : null}
    </label>
  )
}
