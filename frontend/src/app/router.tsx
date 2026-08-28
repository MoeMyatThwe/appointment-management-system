import { Navigate, createBrowserRouter, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AppLayout } from '../layouts/AppLayout'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { AppointmentsPage } from '../features/appointments/pages/AppointmentsPage'
import { CustomersPage } from '../features/customers/pages/CustomersPage'
import { StaffPage } from '../features/staff/pages/StaffPage'
import { useAuthStore } from '../features/auth/authStore'
import { ServicesPage } from '../features/services/pages/ServicesPage'
import { OnboardingPage } from '../features/onboarding/pages/OnboardingPage'
import { useQuery } from '@tanstack/react-query'
import { fetchAppointments } from '../features/appointments/appointmentsApi'
import { fetchCustomers } from '../features/customers/customersApi'
import { fetchStaff } from '../features/staff/staffApi'
import { fetchServices } from '../features/services/servicesApi'
import { ResourcesPage } from '../features/resources/pages/ResourcesPage'
import { SchedulePage } from '../features/schedule/pages/SchedulePage'
import { CalendarPage } from '../features/appointments/pages/CalendarPage'
import { PublicBookingPage } from '../features/booking/pages/PublicBookingPage'
import { ReportsPage } from '../features/reports/pages/ReportsPage'
import { PlatformAdminPage } from '../features/platform/pages/PlatformAdminPage'
import { PlatformSupportPage } from '../features/platform/pages/PlatformSupportPage'
import { PlatformSettingsPage } from '../features/platform/pages/PlatformSettingsPage'
import { PlatformAuditLogPage } from '../features/platform/pages/PlatformAuditLogPage'
import { RecoveryPage } from '../features/auth/pages/RecoveryPage'
import { BillingPage } from '../features/billing/pages/BillingPage'
import { LandingPage } from '../features/landing/pages/LandingPage'

function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const appointments = useQuery({ queryKey: ['appointments'], queryFn: () => fetchAppointments() })
  const customers = useQuery({ queryKey: ['customers'], queryFn: () => fetchCustomers() })
  const staff = useQuery({ queryKey: ['staff'], queryFn: fetchStaff })
  const services = useQuery({ queryKey: ['services'], queryFn: fetchServices })
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = appointments.data?.filter((appointment) => appointment.startTime && appointment.startTime >= new Date().toISOString() && appointment.status !== 'CANCELLED').slice(0, 5) ?? []

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-semibold text-indigo-600">Workspace overview</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Good morning</h2>
        <p className="mt-2 text-sm text-slate-500">Here is what is happening in your business today.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Today', appointments.data?.filter((item) => item.startTime?.startsWith(today) && item.status !== 'CANCELLED').length ?? 0, 'Appointments scheduled'],
          ['Customers', customers.data?.length ?? 0, 'People in your workspace'],
          ['Staff', staff.data?.length ?? 0, 'Bookable team members'],
          ['Services', services.data?.length ?? 0, 'Services available to book'],
        ].map(([label, value, detail]) => <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" key={label}><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between"><div><h3 className="text-lg font-semibold text-slate-900">Upcoming appointments</h3><p className="mt-1 text-sm text-slate-500">Your next scheduled customer visits.</p></div><a className="text-sm font-semibold text-indigo-600" href="/appointments">View all</a></div>
          <div className="mt-5 grid gap-3">{upcoming.length ? upcoming.map((appointment) => <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3" key={appointment.id}><div><p className="font-semibold text-slate-800">{new Date(appointment.startTime).toLocaleString()}</p><p className="mt-1 text-xs text-slate-500">{appointment.status.replace('_', ' ')}</p></div><span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">Scheduled</span></div>) : <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No upcoming appointments yet.</p>}</div>
        </section>
        <section className="rounded-2xl bg-indigo-600 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-indigo-200">Next steps</p><h3 className="mt-2 text-xl font-bold">Make your workspace bookable</h3><p className="mt-2 text-sm leading-6 text-indigo-100">Add your team, services, and business hours so appointments can be managed smoothly.</p>
          <div className="mt-6 grid gap-2"><a className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-50" href="/staff">Add staff member</a><a className="rounded-xl bg-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-400" href="/services">Create a service</a>{user?.tenantId ? <a className="rounded-xl border border-indigo-300 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500" href={`/book/${user.tenantId}`} target="_blank" rel="noreferrer">Open public booking page</a> : null}</div>
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
  return <PlatformAuditLogPage />
}

function PlatformSettingsRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <p>Loading...</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'PLATFORM_ADMIN') return <Navigate to="/dashboard" replace />
  return <PlatformSettingsPage />
}

function PlatformSupportRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <p>Loading...</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'PLATFORM_ADMIN') return <Navigate to="/dashboard" replace />
  return <PlatformSupportPage />
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

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (!isAuthenticated) {
    if (location.pathname === '/') return <LandingPage />
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
  return <PlatformAdminPage />
}

function OnboardingRoute() {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <p>Loading...</p>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.onboardingCompleted) return <Navigate to="/dashboard" replace />
  return <OnboardingPage />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/recovery', element: <RecoveryPage /> },
  { path: '/book/:tenantId', element: <PublicBookingPage /> },
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
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'staff', element: <RoleRoute roles={['TENANT_ADMIN', 'MANAGER']}><StaffPage /></RoleRoute> },
      { path: 'services', element: <RoleRoute roles={['TENANT_ADMIN', 'MANAGER']}><ServicesPage /></RoleRoute> },
      { path: 'resources', element: <RoleRoute roles={['TENANT_ADMIN', 'MANAGER']}><ResourcesPage /></RoleRoute> },
      { path: 'schedule', element: <RoleRoute roles={['TENANT_ADMIN', 'MANAGER']}><SchedulePage /></RoleRoute> },
      { path: 'reports', element: <RoleRoute roles={['TENANT_ADMIN', 'MANAGER', 'STAFF']}><ReportsPage /></RoleRoute> },
      { path: 'billing', element: <RoleRoute roles={['TENANT_ADMIN']}><BillingPage /></RoleRoute> },
      { index: true, element: <Navigate to="/dashboard" replace /> },
    ],
  },
])
