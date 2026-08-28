import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '../features/auth/authStore'
import { FiMenu, FiX } from 'react-icons/fi'

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const canManageOperations = user?.role === 'TENANT_ADMIN' || user?.role === 'MANAGER'
  const canViewBilling = user?.role === 'TENANT_ADMIN'
  const canViewReports = user?.role === 'TENANT_ADMIN' || user?.role === 'MANAGER' || user?.role === 'STAFF'

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b1020]/80 lg:grid lg:h-screen lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden">
      {isSidebarOpen ? <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" type="button" aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)} /> : null}
      <aside className={`scrollbar-hidden fixed inset-y-0 left-0 z-40 w-[280px] -translate-x-full overflow-y-auto border-r border-indigo-950/20 bg-[#18234a] px-5 py-5 text-slate-200 shadow-xl shadow-indigo-950/10 transition-transform duration-200 lg:static lg:h-screen lg:w-auto lg:translate-x-0 lg:border-b-0 lg:px-6 lg:py-8 ${isSidebarOpen ? 'translate-x-0' : ''}`}>
        <div className="mb-8">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b6c0d4]">Workspace</p><h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-white">{user?.tenantName ?? 'Appointment SaaS'}</h1><p className="mt-2 truncate text-sm text-slate-400">{user?.email ?? 'Team member'}</p><span className="mt-3 inline-flex rounded-full bg-slate-400/20 px-2.5 py-1 text-xs font-bold text-[#c0c8d8]">{user?.role?.replace('_', ' ') ?? 'TEAM MEMBER'}</span></div><button className="mt-[-0.35rem] rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden" type="button" aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)}><FiX size={22} /></button></div>
        </div>
        <nav className="grid gap-6">
          <NavLink onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-[#344263] text-white shadow-lg shadow-slate-950/20' : 'text-slate-300 hover:bg-slate-800 hover:text-[#d7dce6]'}`} to="/dashboard">
            Overview
          </NavLink>
          <SidebarGroup label="Scheduling" onNavigate={() => setIsSidebarOpen(false)}>
            <NavItem to="/appointments" onNavigate={() => setIsSidebarOpen(false)}>Appointments</NavItem>
            <NavItem to="/calendar" onNavigate={() => setIsSidebarOpen(false)}>Calendar</NavItem>
            {user?.tenantId ? <a onClick={() => setIsSidebarOpen(false)} className="rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-400/40 hover:bg-slate-800 hover:text-[#d7dce6]" href={`/book/${user.tenantId}`} target="_blank" rel="noreferrer">Public booking page <span className="ml-1 text-xs text-[#b6c0d4]">↗</span></a> : null}
          </SidebarGroup>
          <SidebarGroup label="Customers" onNavigate={() => setIsSidebarOpen(false)}>
            <NavItem to="/customers" onNavigate={() => setIsSidebarOpen(false)}>Customer directory</NavItem>
          </SidebarGroup>
          {canManageOperations ? <SidebarGroup label="Operations" onNavigate={() => setIsSidebarOpen(false)}>
            <NavItem to="/staff" onNavigate={() => setIsSidebarOpen(false)}>Staff</NavItem>
            <NavItem to="/services" onNavigate={() => setIsSidebarOpen(false)}>Services</NavItem>
            <NavItem to="/resources" onNavigate={() => setIsSidebarOpen(false)}>Rooms & resources</NavItem>
          </SidebarGroup> : null}
          {canManageOperations || canViewBilling ? <SidebarGroup label="Settings" onNavigate={() => setIsSidebarOpen(false)}>
            {canManageOperations ? <NavItem to="/schedule" onNavigate={() => setIsSidebarOpen(false)}>Business hours</NavItem> : null}
            {canViewBilling ? <NavItem to="/billing" onNavigate={() => setIsSidebarOpen(false)}>Subscription & billing</NavItem> : null}
          </SidebarGroup> : null}
          {canViewReports ? <SidebarGroup label="Insights" onNavigate={() => setIsSidebarOpen(false)}>
            <NavItem to="/reports" onNavigate={() => setIsSidebarOpen(false)}>Reports & exports</NavItem>
          </SidebarGroup> : null}
        </nav>
        <button className="mt-10 w-full rounded-lg border border-slate-700 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800" type="button" onClick={() => void logout()}>
          Logout
        </button>
      </aside>
      <main className="scrollbar-hidden min-h-screen min-w-0 overflow-x-hidden overflow-y-auto bg-[#0b1020]/75 px-5 py-6 sm:px-8 lg:h-screen lg:px-10 lg:py-10">
        <button className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#18234a] px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 lg:hidden" type="button" aria-label="Open navigation" onClick={() => setIsSidebarOpen(true)}><FiMenu size={18} />Menu</button>
        <Outlet />
      </main>
    </div>
  )
}

function SidebarGroup({ label, children }: { label: string; children: ReactNode; onNavigate?: () => void }) {
  return (
    <div>
      <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#b6c0d4]">{label}</p>
      <div className="grid gap-1">{children}</div>
    </div>
  )
}

function NavItem({ to, children, onNavigate }: { to: string; children: ReactNode; onNavigate?: () => void }) {
  return (
    <NavLink onClick={onNavigate} className={({ isActive }) => `rounded-xl border px-3 py-2.5 text-sm font-medium transition ${isActive ? 'border-[#52617f] bg-[#344263] text-white shadow-sm' : 'border-transparent text-slate-300 hover:border-slate-400/40 hover:bg-slate-800 hover:text-[#d7dce6]'}`} to={to}>
      {children}
    </NavLink>
  )
}
