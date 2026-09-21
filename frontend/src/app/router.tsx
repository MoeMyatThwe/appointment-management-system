import { lazy } from 'react'
import { Link, Navigate, createBrowserRouter, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppLayout } from '../layouts/AppLayout'
import { useAuthStore } from '../features/auth/authStore'
import { useQuery } from '@tanstack/react-query'
import { fetchDashboardSummary } from '../features/reports/reportsApi'
import { LandingPage } from '../features/landing/pages/LandingPage'
import { formatDateTimeInTimezone } from '../shared/utils/dateTime'
import { StatusBadge } from '../shared/components/StatusBadge'

const LazyBillingPage = lazy(() => import('../features/billing/pages/BillingPage').then((module) => ({ default: module.BillingPage })))
const LazyOnboardingPage = lazy(() => import('../features/onboarding/pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })))
const LazyPlatformAdminPage = lazy(() => import('../features/platform/pages/PlatformAdminPage').then((module) => ({ default: module.PlatformAdminPage })))
const LazyPlatformAuditLogPage = lazy(() => import('../features/platform/pages/PlatformAuditLogPage').then((module) => ({ default: module.PlatformAuditLogPage })))
const LazyPlatformSettingsPage = lazy(() => import('../features/platform/pages/PlatformSettingsPage').then((module) => ({ default: module.PlatformSettingsPage })))
const LazyPlatformSupportPage = lazy(() => import('../features/platform/pages/PlatformSupportPage').then((module) => ({ default: module.PlatformSupportPage })))
const LazyReportsPage = lazy(() => import('../features/reports/pages/ReportsPage').then((module) => ({ default: module.ReportsPage })))
const LazyResourcesPage = lazy(() => import('../features/resources/pages/ResourcesPage').then((module) => ({ default: module.ResourcesPage })))
const LazySchedulePage = lazy(() => import('../features/schedule/pages/SchedulePage').then((module) => ({ default: module.SchedulePage })))
const LazyServicesPage = lazy(() => import('../features/services/pages/ServicesPage').then((module) => ({ default: module.ServicesPage })))
const LazyStaffPage = lazy(() => import('../features/staff/pages/StaffPage').then((module) => ({ default: module.StaffPage })))
const LazySupportAccessPage = lazy(() => import('../features/platform/pages/SupportAccessConsentPage').then((module) => ({ default: module.SupportAccessConsentPage })))

function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const summary = useQuery({ queryKey: ['dashboard-summary'], queryFn: fetchDashboardSummary })
  const isLoading = summary.isLoading
  const hasError = summary.isError

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8" data-tour="dashboard-overview">
        <p className="text-sm font-semibold text-indigo-600">Workspace overview</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Good morning</h2>
        <p className="mt-2 text-sm text-slate-500">Here is what is happening in your business today.</p>
      </div>
      {hasError ? <div className="mb-6 rounded-2xl border border-rose-300/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-200" role="alert">Some workspace data could not be loaded. Refresh the page to try again.</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Today', summary.data?.appointmentsToday ?? 0, 'Appointments scheduled'],
          ['Upcoming', summary.data?.upcomingAppointments ?? 0, 'Future appointments'],
          ['Completed', summary.data?.completedAppointments ?? 0, 'Completed appointments'],
          ['Cancelled', summary.data?.cancelledAppointments ?? 0, 'Cancelled appointments'],
          ['Customers', summary.data?.customerCount ?? 0, 'People in your workspace'],
          ['Services', summary.data?.serviceCount ?? 0, 'Services available to book'],
        ].map(([label, value, detail]) => <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" key={label}><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? '—' : value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-slate-900">Upcoming appointments</h3><p className="mt-1 text-sm text-slate-500">Your next scheduled customer visits.</p></div><Link className="text-sm font-semibold text-indigo-600" to="/appointments">View all</Link></div>
          <div className="mt-5 grid gap-3">{isLoading ? <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Loading appointments...</p> : summary.data?.nextAppointments.length ? summary.data.nextAppointments.map((appointment) => <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3" key={appointment.id}><div className="min-w-0"><p className="truncate font-semibold text-slate-800">{formatDateTimeInTimezone(appointment.startTime, user?.timezone ?? 'UTC')}</p><p className="mt-1 text-xs text-slate-500">{appointment.status.replace('_', ' ')}</p></div><StatusBadge label="Scheduled" tone="info" /></div>) : <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No upcoming appointments yet.</p>}</div>
        </section>
        <section className="rounded-2xl bg-indigo-600 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-indigo-200">Next steps</p><h3 className="mt-2 text-xl font-bold">Make your workspace bookable</h3><p className="mt-2 text-sm leading-6 text-indigo-100">Add your team, services, and business hours so appointments can be managed smoothly.</p>
          <div className="mt-6 grid gap-2"><a className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-50" href="/staff">Add staff member</a><a className="rounded-xl bg-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-400" href="/services">Create a service</a>{user?.tenantId ? <Link className="rounded-xl border border-indigo-300 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500" to={`/book/${user.tenantId}`}>Open public booking page</Link> : null}</div>
        </section>
      </div>
    </div>
  )
}

function PlatformAuditLogRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <p>Loading...</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'PLATFORM_ADMIN') return <Navigate to="/dashboard" replace />
  return <LazyPlatformAuditLogPage />
}

function PlatformSettingsRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <p>Loading...</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'PLATFORM_ADMIN') return <Navigate to="/dashboard" replace />
  return <LazyPlatformSettingsPage />
}

function PlatformSupportRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <p>Loading...</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'PLATFORM_ADMIN') return <Navigate to="/dashboard" replace />
  return <LazyPlatformSupportPage />
}

function RouteErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5">
      <section className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-2xl">
        <p className="text-sm font-semibold text-rose-600">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">We could not load this page</h1>
        <p className="mt-2 text-sm text-slate-500">Refresh the page and try again. Your saved business data has not been deleted.</p>
        <button className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="button" onClick={() => window.location.reload()}>Refresh page</button>
      </section>
    </main>
  )
}

function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()

  if (location.pathname === '/') {
    return <LandingPage />
  }

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (user?.role === 'PLATFORM_ADMIN') {
    return <Navigate to="/platform" replace />
  }
  if (user?.role === 'CUSTOMER') {
    return user.tenantId ? <Navigate to={`/book/${user.tenantId}`} replace /> : <Navigate to="/login" replace />
  }
  if (user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  return <AppLayout />
}

function RoleRoute({ roles, children }: { roles: string[]; children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <p>Loading...</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function PlatformAdminRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <p>Loading...</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'PLATFORM_ADMIN') return <Navigate to="/dashboard" replace />
  return <LazyPlatformAdminPage />
}

function OnboardingRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <p>Loading...</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.onboardingCompleted) return <Navigate to="/dashboard" replace />
  return <LazyOnboardingPage />
}

export const router = createBrowserRouter([
  { path: '/login', errorElement: <RouteErrorPage />, lazy: async () => ({ Component: (await import('../features/auth/pages/LoginPage')).LoginPage }) },
  { path: '/register', errorElement: <RouteErrorPage />, lazy: async () => ({ Component: (await import('../features/auth/pages/RegisterPage')).RegisterPage }) },
  { path: '/recovery', errorElement: <RouteErrorPage />, lazy: async () => ({ Component: (await import('../features/auth/pages/RecoveryPage')).RecoveryPage }) },
  { path: '/book/:tenantId', errorElement: <RouteErrorPage />, lazy: async () => ({ Component: (await import('../features/booking/pages/PublicBookingPage')).PublicBookingPage }) },
  { path: '/book/:tenantId/manage/:token', errorElement: <RouteErrorPage />, lazy: async () => ({ Component: (await import('../features/booking/pages/PublicBookingManagePage')).PublicBookingManagePage }) },
  { path: '/onboarding', element: <OnboardingRoute /> },
  { path: '/platform/support', element: <PlatformSupportRoute /> },
  { path: '/platform/settings', element: <PlatformSettingsRoute /> },
  { path: '/platform/audit-log', element: <PlatformAuditLogRoute /> },
  { path: '/platform', element: <PlatformAdminRoute /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'appointments', lazy: async () => ({ Component: (await import('../features/appointments/pages/AppointmentsPage')).AppointmentsPage }) },
      { path: 'calendar', lazy: async () => ({ Component: (await import('../features/appointments/pages/CalendarPage')).CalendarPage }) },
      { path: 'customers', lazy: async () => ({ Component: (await import('../features/customers/pages/CustomersPage')).CustomersPage }) },
      { path: 'staff', lazy: async () => ({ Component: () => <RoleRoute roles={['TENANT_ADMIN', 'MANAGER']}><LazyStaffPage /></RoleRoute> }) },
      { path: 'services', lazy: async () => ({ Component: () => <RoleRoute roles={['TENANT_ADMIN', 'MANAGER']}><LazyServicesPage /></RoleRoute> }) },
      { path: 'resources', lazy: async () => ({ Component: () => <RoleRoute roles={['TENANT_ADMIN', 'MANAGER']}><LazyResourcesPage /></RoleRoute> }) },
      { path: 'schedule', lazy: async () => ({ Component: () => <RoleRoute roles={['TENANT_ADMIN', 'MANAGER']}><LazySchedulePage /></RoleRoute> }) },
      { path: 'reports', lazy: async () => ({ Component: () => <RoleRoute roles={['TENANT_ADMIN', 'MANAGER', 'STAFF']}><LazyReportsPage /></RoleRoute> }) },
      { path: 'billing', lazy: async () => ({ Component: () => <RoleRoute roles={['TENANT_ADMIN']}><LazyBillingPage /></RoleRoute> }) },
      { path: 'support-access', lazy: async () => ({ Component: () => <RoleRoute roles={['TENANT_ADMIN']}><LazySupportAccessPage /></RoleRoute> }) },
      { index: true, element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
