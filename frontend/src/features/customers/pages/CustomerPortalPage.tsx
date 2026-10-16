import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDateTimeInTimezone } from '../../../shared/utils/dateTime'
import { useAuthStore } from '../../auth/authStore'
import { cancelCustomerAppointment, createCustomerCheckout, fetchCustomerAppointments, fetchPublicBusinesses } from '../customerPortalApi'
import { getApiErrorMessage } from '../../../shared/api/apiError'
import type { CustomerAppointmentFilters } from '../customerPortalApi'

export function CustomerPortalPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [actionError, setActionError] = useState('')
  const [filters, setFilters] = useState<CustomerAppointmentFilters>({
    page: 0,
    size: 10,
    search: '',
    status: '',
    paymentStatus: '',
    dateFilter: 'ALL',
  })
  const appointments = useQuery({
    queryKey: ['customer-appointments', filters],
    queryFn: () => fetchCustomerAppointments(filters),
  })
  const businesses = useQuery({ queryKey: ['public-businesses'], queryFn: fetchPublicBusinesses })

  async function cancel(id: string) {
    if (!window.confirm('Cancel this appointment? Any eligible refund will be started automatically.')) return
    setActionError('')
    try {
      await cancelCustomerAppointment(id)
      await queryClient.invalidateQueries({ queryKey: ['customer-appointments'] })
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'general'))
    }
  }

  function updateFilter<K extends keyof CustomerAppointmentFilters>(key: K, value: CustomerAppointmentFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? Number(value) : 0 }))
  }

  function paymentBadge(status: string) {
    if (status === 'PAID') return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
    if (status === 'PENDING') return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
    if (status === 'FAILED') return 'bg-rose-100 text-rose-800 ring-1 ring-rose-200'
    if (status === 'REFUNDED') return 'bg-slate-200 text-slate-800 ring-1 ring-slate-300'
    return 'bg-orange-100 text-orange-800 ring-1 ring-orange-200'
  }

  async function pay(id: string) {
    setActionError('')
    try {
      const { checkoutUrl } = await createCustomerCheckout(id)
      window.location.assign(checkoutUrl)
    } catch (error) {
      setActionError(getApiErrorMessage(error, 'general'))
    }
  }

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <button className="text-lg font-bold tracking-tight text-slate-900" type="button" onClick={() => navigate('/customer-portal')}>Schedora</button>
        <nav className="flex items-center gap-3" aria-label="Customer navigation">
          <span className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">Customer portal</span>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={() => void logout()}>Sign out</button>
        </nav>
      </div>
    </header>
    <div className="mx-auto max-w-5xl px-5 py-10">
    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Customer portal</p>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-3xl font-bold text-slate-900">Your appointments</h1><p className="mt-2 text-sm text-slate-500">{user?.email}</p></div>
      <span className="text-sm text-slate-500">Choose a business below to book</span>
    </div>
    {actionError ? <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">{actionError}</p> : null}
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-slate-900">Businesses accepting online bookings</h2>
      {businesses.isLoading ? <p className="mt-3 text-sm text-slate-500">Loading businesses...</p> : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {businesses.data?.map((business) => <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" key={business.tenantId}>
          <h3 className="font-semibold text-slate-900">{business.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{business.serviceCount} services · {business.timezone}</p>
          <button className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700" type="button" onClick={() => navigate(`/book/${business.tenantId}`)}>View services and book</button>
        </article>)}
      </div>
      {!businesses.isLoading && !businesses.data?.length ? <p className="mt-3 text-sm text-slate-500">No businesses are accepting online bookings yet.</p> : null}
    </section>
    <section className="mt-8 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap gap-3">
        <input className="min-w-56 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm" placeholder="Search service, notes, or appointment ID" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} />
        <select className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={filters.dateFilter} onChange={(event) => updateFilter('dateFilter', event.target.value as CustomerAppointmentFilters['dateFilter'])}>
          <option value="ALL">All dates</option><option value="UPCOMING">Upcoming</option><option value="PAST">Past</option>
        </select>
        <select className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="">All appointment statuses</option><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="CHECKED_IN">Checked in</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option><option value="NO_SHOW">No-show</option>
        </select>
        <select className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" value={filters.paymentStatus} onChange={(event) => updateFilter('paymentStatus', event.target.value)}>
          <option value="">All payment statuses</option><option value="UNPAID">Unpaid</option><option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="FAILED">Failed</option><option value="REFUNDED">Refunded</option>
        </select>
      </div>
    </section>
    <div className="mt-8 grid gap-4">
      {appointments.isLoading ? <p>Loading appointments...</p> : null}
      {appointments.data?.content.map((appointment) => <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200" key={appointment.id}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="font-semibold text-slate-900">{appointment.serviceName}</p><p className="mt-1 text-sm text-slate-600">{formatDateTimeInTimezone(appointment.startTime, user?.timezone ?? 'UTC')}</p><p className="mt-1 text-sm text-slate-500">Staff: {appointment.staffName} · Status: {appointment.status}</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paymentBadge(appointment.paymentStatus)}`}>{appointment.paymentStatus}</span>
        </div>
        <p className="mt-3 text-sm text-slate-500">Amount due: {appointment.amountDue ?? '—'} · Balance: {appointment.balance ?? '—'}</p>
        {appointment.refundStatus && appointment.refundStatus !== 'NOT_REFUNDED' ? <p className="mt-1 text-sm text-amber-700">Refund: {appointment.refundStatus}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {appointment.paymentStatus !== 'PAID' && appointment.balance && appointment.balance > 0 ? <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white" type="button" onClick={() => void pay(appointment.id)}>Pay now</button> : null}
          {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' ? <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => void cancel(appointment.id)}>Cancel appointment</button> : null}
        </div>
      </article>)}
      {!appointments.isLoading && !appointments.data?.content.length ? <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">No appointments yet.</p><p className="mt-2 text-sm text-slate-500">Choose a business above to select a service and available time.</p></div> : null}
      {appointments.data && appointments.data.totalPages > 1 ? <div className="flex items-center justify-between rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200">
        <button className="rounded-lg border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled={appointments.data.first} onClick={() => updateFilter('page', filters.page - 1)}>Previous</button>
        <span className="text-slate-600">Page {appointments.data.number + 1} of {appointments.data.totalPages}</span>
        <button className="rounded-lg border border-slate-300 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled={appointments.data.last} onClick={() => updateFilter('page', filters.page + 1)}>Next</button>
      </div> : null}
    </div>
    </div>
  </main>
}
