import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { FiX } from 'react-icons/fi'

interface DialogProps {
  open: boolean
  title: string
  eyebrow?: string
  onClose: () => void
  children: ReactNode
  variant?: 'modal' | 'drawer'
  className?: string
}

export function Dialog({
  open,
  title,
  eyebrow,
  onClose,
  children,
  variant = 'modal',
  className = '',
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const firstFocusable = panelRef.current?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    )
    ;(firstFocusable ?? panelRef.current)?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocusedRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  const panelClass = variant === 'drawer'
    ? 'absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl'
    : 'relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl'

  return (
    <div
      className={`fixed inset-0 z-50 ${variant === 'modal' ? 'flex items-center justify-center p-4 sm:p-6' : ''} bg-slate-950/55`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className={`${panelClass} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-dialog-title"
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            {eyebrow ? <p className="text-sm font-semibold text-indigo-600">{eyebrow}</p> : null}
            <h2 id="shared-dialog-title" className="mt-1 text-xl font-bold text-slate-900">{title}</h2>
          </div>
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            type="button"
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
