import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '../features/auth/authStore'
import {
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiExternalLink,
  FiGrid,
  FiHelpCircle,
  FiHome,
  FiLogOut,
  FiMenu,
  FiShield,
  FiUser,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import { WorkspaceTour } from '../features/onboarding/components/WorkspaceTour'
import { ContextualHelp } from '../shared/components/ContextualHelp'
import { getPageGuide } from '../shared/components/pageGuides'

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('schedora-sidebar-collapsed') === 'true')
  const [tourRequest, setTourRequest] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const canManageOperations = user?.role === 'TENANT_ADMIN' || user?.role === 'MANAGER'
  const canViewBilling = user?.role === 'TENANT_ADMIN'
  const canViewReports = user?.role === 'TENANT_ADMIN' || user?.role === 'MANAGER' || user?.role === 'STAFF'
  const pageGuide = getPageGuide(location.pathname)

  useEffect(() => {
    localStorage.setItem('schedora-sidebar-collapsed', String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className={`min-h-screen overflow-x-hidden bg-[#0f172a] lg:grid lg:h-screen lg:overflow-hidden ${isSidebarCollapsed ? 'lg:grid-cols-[88px_minmax(0,1fr)]' : 'lg:grid-cols-[280px_minmax(0,1fr)]'}`}>
      {isSidebarOpen ? <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" type="button" aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)} /> : null}
      <aside className={`scrollbar-hidden fixed inset-y-0 left-0 z-40 w-[280px] -translate-x-full overflow-y-auto border-r border-slate-600/60 bg-[#17243d] px-5 py-5 text-slate-200 shadow-xl shadow-slate-950/30 transition-[width,transform,padding] duration-200 lg:static lg:h-screen lg:translate-x-0 lg:border-b-0 lg:py-8 ${isSidebarCollapsed ? 'lg:w-[88px] lg:px-3' : 'lg:w-auto lg:px-6'} ${isSidebarOpen ? 'translate-x-0' : ''}`}>
        <div className={`mb-8 flex items-start gap-3 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed ? <div className="min-w-0"><h1 className="truncate text-2xl font-bold tracking-tight text-white">{user?.tenantName ?? 'Appointment SaaS'}</h1><p className="mt-2 truncate text-sm text-slate-300">{user?.email ?? 'Team member'}</p><span className="mt-3 inline-flex rounded-full bg-blue-400/20 px-2.5 py-1 text-xs font-bold text-blue-100">{user?.role?.replace('_', ' ') ?? 'TEAM MEMBER'}</span></div> : <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5b8cff] text-xl font-black text-[#0f172a]" title={user?.tenantName ?? 'Appointment SaaS'}>S</div>}
          <div className="flex items-center gap-1">
            <button className="hidden rounded-lg p-2 text-slate-200 hover:bg-slate-700 hover:text-white lg:inline-flex" type="button" aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}>{isSidebarCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}</button>
              <button className="rounded-lg p-2 text-slate-200 hover:bg-slate-700 hover:text-white lg:hidden" type="button" aria-label="Close navigation" onClick={() => setIsSidebarOpen(false)}><FiX size={22} /></button>
          </div>
        </div>
        <nav className="grid gap-3">
          <Link title={isSidebarCollapsed ? 'Landing page' : undefined} onClick={() => setIsSidebarOpen(false)} className={`inline-flex min-w-0 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-700 hover:text-white ${isSidebarCollapsed ? 'justify-center' : ''}`} to="/">
            <FiHome aria-hidden="true" size={18} />{!isSidebarCollapsed ? <span className="min-w-0 break-words leading-5">Landing page</span> : null}
          </Link>
          <NavLink data-tour="dashboard-nav" title={isSidebarCollapsed ? 'Overview' : undefined} onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `inline-flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${isSidebarCollapsed ? 'justify-center' : ''} ${isActive ? 'border-[#7ea5ff] bg-[#36558f] text-white shadow-lg shadow-slate-950/20' : 'border-transparent text-slate-200 hover:border-slate-500 hover:bg-slate-700 hover:text-white'}`} to="/dashboard">
            <FiGrid aria-hidden="true" size={18} />{!isSidebarCollapsed ? <span className="min-w-0 break-words leading-5">Overview</span> : null}
          </NavLink>
          <SidebarGroup collapsed={isSidebarCollapsed}>
            <NavItem dataTour="appointments-nav" icon={<FiCalendar />} collapsed={isSidebarCollapsed} to="/appointments" onNavigate={() => setIsSidebarOpen(false)}>Appointments</NavItem>
            <NavItem dataTour="calendar-nav" icon={<FiClock />} collapsed={isSidebarCollapsed} to="/calendar" onNavigate={() => setIsSidebarOpen(false)}>Calendar</NavItem>
            {user?.tenantId ? <Link data-tour="public-booking-nav" title={isSidebarCollapsed ? 'Public booking page' : undefined} onClick={() => setIsSidebarOpen(false)} className={`inline-flex min-w-0 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-700 hover:text-white ${isSidebarCollapsed ? 'justify-center' : ''}`} to={`/book/${user.tenantId}`}><FiExternalLink aria-hidden="true" />{!isSidebarCollapsed ? <span className="min-w-0 break-words leading-5">Public booking page</span> : null}</Link> : null}
          </SidebarGroup>
          <SidebarGroup collapsed={isSidebarCollapsed}>
            <NavItem icon={<FiUsers />} collapsed={isSidebarCollapsed} to="/customers" onNavigate={() => setIsSidebarOpen(false)}>Customer directory</NavItem>
          </SidebarGroup>
          {canManageOperations ? <SidebarGroup collapsed={isSidebarCollapsed}>
            <NavItem dataTour="staff-nav" icon={<FiUser />} collapsed={isSidebarCollapsed} to="/staff" onNavigate={() => setIsSidebarOpen(false)}>Staff</NavItem>
            <NavItem dataTour="services-nav" icon={<FiBriefcase />} collapsed={isSidebarCollapsed} to="/services" onNavigate={() => setIsSidebarOpen(false)}>Services</NavItem>
            <NavItem icon={<FiGrid />} collapsed={isSidebarCollapsed} to="/resources" onNavigate={() => setIsSidebarOpen(false)}>Rooms & resources</NavItem>
          </SidebarGroup> : null}
          {canManageOperations || canViewBilling ? <SidebarGroup collapsed={isSidebarCollapsed}>
            {canManageOperations ? <NavItem dataTour="schedule-nav" icon={<FiClock />} collapsed={isSidebarCollapsed} to="/schedule" onNavigate={() => setIsSidebarOpen(false)}>Business hours</NavItem> : null}
            {canViewBilling ? <NavItem icon={<FiCreditCard />} collapsed={isSidebarCollapsed} to="/billing" onNavigate={() => setIsSidebarOpen(false)}>Subscription & billing</NavItem> : null}
            {canViewBilling ? <NavItem icon={<FiShield />} collapsed={isSidebarCollapsed} to="/support-access" onNavigate={() => setIsSidebarOpen(false)}>Support access</NavItem> : null}
          </SidebarGroup> : null}
          {canViewReports ? <SidebarGroup collapsed={isSidebarCollapsed}>
            <NavItem icon={<FiBarChart2 />} collapsed={isSidebarCollapsed} to="/reports" onNavigate={() => setIsSidebarOpen(false)}>Reports & exports</NavItem>
          </SidebarGroup> : null}
        </nav>
        <button data-tour="workspace-help" title={isSidebarCollapsed ? 'Help & guide' : undefined} className={`mt-10 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 px-3 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 ${isSidebarCollapsed ? 'px-2' : ''}`} type="button" onClick={() => setTourRequest((request) => request + 1)}>
          <FiHelpCircle aria-hidden="true" size={16} />
          {!isSidebarCollapsed ? 'Help & guide' : null}
        </button>
        <button title={isSidebarCollapsed ? 'Logout' : undefined} className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 px-3 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-slate-700 ${isSidebarCollapsed ? 'px-2' : ''}`} type="button" onClick={() => void handleLogout()}>
          <FiLogOut aria-hidden="true" size={16} />{!isSidebarCollapsed ? 'Logout' : null}
        </button>
      </aside>
      <main className="scrollbar-hidden min-h-screen min-w-0 overflow-x-hidden overflow-y-auto bg-[#0f172a]/90 px-5 py-6 sm:px-8 lg:h-screen lg:px-10 lg:py-10" aria-label="Workspace content">
        <button className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-[#1b2b4a] px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700 lg:hidden" type="button" aria-label="Open navigation" onClick={() => setIsSidebarOpen(true)}><FiMenu size={18} />Menu</button>
        {pageGuide ? <div className="mb-4 flex justify-end"><ContextualHelp title={pageGuide.title} summary={pageGuide.summary} points={pageGuide.points} /></div> : null}
        <Outlet />
      </main>
      <WorkspaceTour request={tourRequest} />
    </div>
  )
}

function SidebarGroup({ children }: { children: ReactNode; collapsed: boolean }) {
  return (
    <div className="grid gap-1">
      {children}
    </div>
  )
}

function NavItem({ to, children, onNavigate, dataTour, icon, collapsed }: { to: string; children: ReactNode; onNavigate?: () => void; dataTour?: string; icon: ReactNode; collapsed: boolean }) {
  return (
    <NavLink data-tour={dataTour} title={collapsed ? String(children) : undefined} onClick={onNavigate} className={({ isActive }) => `inline-flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${collapsed ? 'justify-center' : ''} ${isActive ? 'border-[#7ea5ff] bg-[#36558f] text-white shadow-sm' : 'border-transparent text-slate-200 hover:border-slate-500 hover:bg-slate-700 hover:text-white'}`} to={to}>
    {icon}{!collapsed ? <span className="min-w-0 break-words leading-5">{children}</span> : null}
    </NavLink>
  )
}
