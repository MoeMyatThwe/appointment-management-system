import { useEffect, useState } from 'react'
import { FiHelpCircle, FiX } from 'react-icons/fi'
import { useEscapeKey } from '../hooks/useEscapeKey'

interface ContextualHelpProps {
  title: string
  summary: string
  points: string[]
}

export function ContextualHelp({ title, summary, points }: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  useEscapeKey(isOpen, () => setIsOpen(false))

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  return (
    <>
      <button
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-500 bg-slate-800/80 text-slate-200 transition hover:border-indigo-300 hover:bg-slate-700 hover:text-white"
        type="button"
        aria-label={`About ${title}`}
        title={`About ${title}`}
        onClick={() => setIsOpen(true)}
      >
        <FiHelpCircle aria-hidden="true" size={18} />
      </button>
      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-5 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false)
          }}
        >
          <section className="max-h-[calc(100vh-2.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-600 bg-[#1b2740] p-6 text-slate-100 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="contextual-help-title">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-indigo-300">Page guide</p>
                <h2 id="contextual-help-title" className="mt-1 text-xl font-bold">{title}</h2>
              </div>
              <button className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white" type="button" aria-label="Close help" onClick={() => setIsOpen(false)}>
                <FiX aria-hidden="true" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{summary}</p>
            <ul className="mt-5 grid gap-3 text-sm leading-6 text-slate-200">
              {points.map((point) => <li className="flex gap-3" key={point}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-300" />{point}</li>)}
            </ul>
            <div className="mt-6 flex justify-end">
              <button className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400" type="button" onClick={() => setIsOpen(false)}>Got it</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  )
}
