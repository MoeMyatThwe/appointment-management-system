import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../auth/authStore'
import { ContextualHelp } from '../../../shared/components/ContextualHelp'
import { getPageGuide } from '../../../shared/components/pageGuides'

export function PlatformHeader() {
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()
  const pageGuide = getPageGuide(location.pathname)

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300 transition hover:text-indigo-200" to="/platform">
          Schedora Platform
        </Link>

        <div className="flex items-center gap-2">
          {pageGuide ? <ContextualHelp title={pageGuide.title} summary={pageGuide.summary} points={pageGuide.points} /> : null}
          <nav className="hidden items-center gap-2 md:flex">
          <NavLink
            className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            to="/platform"
            end
          >
            Overview
          </NavLink>
          <NavLink
            className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            to="/platform/support"
          >
            Support access
          </NavLink>
          <NavLink
            className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            to="/platform/settings"
          >
            Settings
          </NavLink>
          <NavLink
            className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            to="/platform/audit-log"
          >
            Audit log
          </NavLink>
          </nav>
        </div>

        <button
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          type="button"
          onClick={() => void logout()}
        >
          Log out
        </button>
      </div>
    </header>
  )
}
