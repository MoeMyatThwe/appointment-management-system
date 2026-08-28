import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAppointment,
  rescheduleAppointment,
  searchAppointments,
  updateAppointmentStatus,
} from '../appointmentsApi'
import { createCustomer, fetchCustomers } from '../../customers/customersApi'
import { fetchStaff } from '../../staff/staffApi'
import { fetchServices } from '../../services/servicesApi'
import { fetchResources } from '../../resources/resourcesApi'
import { fetchAppointmentPayment, recordAppointmentPayment } from '../paymentsApi'
import { createStripeCheckout } from '../paymentsApi'
import { FilterBar } from '../../../shared/components/FilterBar'
import { ListState } from '../../../shared/components/ListState'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchInput } from '../../../shared/components/SearchInput'
import type { AppointmentStatus } from '../types'

export function AppointmentsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    customerId: '',
    staffId: '',
    serviceId: '',
    resourceId: '',
    startAtUtc: '',
    endAtUtc: '',
    notes: '',
  })
  const [rescheduleDraft, setRescheduleDraft] = useState<{
    appointmentId: string
    startTime: string
    endTime: string
  } | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [fromFilter, setFromFilter] = useState('')
  const [toFilter, setToFilter] = useState('')
  const [staffFilter, setStaffFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [page, setPage] = useState(0)
  const [showQuickCustomer, setShowQuickCustomer] = useState(false)
  const [quickCustomer, setQuickCustomer] = useState({ name: '', email: '' })
  const [paymentAppointmentId, setPaymentAppointmentId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', search, statusFilter, fromFilter, toFilter, staffFilter, serviceFilter, resourceFilter, page],
    queryFn: () => searchAppointments({
      search,
      status: statusFilter,
      staffId: staffFilter,
      serviceId: serviceFilter,
      resourceId: resourceFilter,
      from: fromFilter || undefined,
      to: toFilter || undefined,
      page,
      size: 10,
      sortBy: 'startTime',
      direction: 'asc',
    }),
  })
  const customersQuery = useQuery({ queryKey: ['customers'], queryFn: () => fetchCustomers() })
  const staffQuery = useQuery({ queryKey: ['staff'], queryFn: fetchStaff })
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: fetchServices })
  const resourcesQuery = useQuery({ queryKey: ['resources'], queryFn: fetchResources })

  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
      setForm({
        customerId: '',
        staffId: '',
        serviceId: '',
        resourceId: '',
        startAtUtc: '',
        endAtUtc: '',
        notes: '',
      })
    },
  })

  const rescheduleMutation = useMutation({
    mutationFn: ({
      appointmentId,
      startAtUtc,
      endAtUtc,
    }: {
      appointmentId: string
      startAtUtc: string
      endAtUtc: string
    }) => rescheduleAppointment(appointmentId, startAtUtc, endAtUtc),
    onSuccess: () => {
      setRescheduleDraft(null)
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(appointmentId, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })
  const quickCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (customer) => {
      setForm((previous) => ({ ...previous, customerId: customer.id }))
      setQuickCustomer({ name: '', email: '' })
      setShowQuickCustomer(false)
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
  const paymentQuery = useQuery({
    queryKey: ['appointment-payment', paymentAppointmentId],
    queryFn: () => fetchAppointmentPayment(paymentAppointmentId!),
    enabled: Boolean(paymentAppointmentId),
  })
  const paymentMutation = useMutation({
    mutationFn: () => recordAppointmentPayment(paymentAppointmentId!, {
      amountPaid: Number(paymentAmount),
      paymentMethod,
      currency: 'USD',
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointment-payment', paymentAppointmentId] })
      setPaymentAmount('')
    },
  })
  const checkoutMutation = useMutation({
    mutationFn: () => createStripeCheckout(paymentAppointmentId!),
    onSuccess: ({ checkoutUrl }) => { window.location.assign(checkoutUrl) },
  })

  const selectedService = servicesQuery.data?.find((service) => service.id === form.serviceId)
  const visibleAppointments = appointmentsQuery.data?.content ?? []

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setFromFilter('')
    setToFilter('')
    setStaffFilter('')
    setServiceFilter('')
    setResourceFilter('')
    setPage(0)
  }

  function nextStatuses(status: AppointmentStatus): Array<{ status: AppointmentStatus; label: string }> {
    if (status === 'PENDING') return [{ status: 'CONFIRMED', label: 'Confirm' }, { status: 'CANCELLED', label: 'Cancel' }]
    if (status === 'CONFIRMED') return [{ status: 'CHECKED_IN', label: 'Check in' }, { status: 'NO_SHOW', label: 'No-show' }, { status: 'CANCELLED', label: 'Cancel' }]
    if (status === 'CHECKED_IN') return [{ status: 'COMPLETED', label: 'Complete' }, { status: 'CANCELLED', label: 'Cancel' }]
    return []
  }

  function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate(form)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Schedule</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Appointments</h2>
          <p className="mt-2 text-sm text-slate-500">Book and manage visits for your customers.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
          {appointmentsQuery.data?.totalElements ?? 0} matching
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6" onSubmit={onCreate}>
          <h3 className="text-lg font-semibold text-slate-900">New appointment</h3>
          <p className="mt-1 text-sm text-slate-500">Choose people and services by name. IDs are handled automatically.</p>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Customer
              <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          value={form.customerId}
          onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
          required
              ><option value="">Select customer</option>{customersQuery.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <button className="text-left text-xs font-semibold text-indigo-600 hover:text-indigo-700" type="button" onClick={() => setShowQuickCustomer((visible) => !visible)}>+ Add new customer</button>
            </label>
            {showQuickCustomer ? <div className="grid gap-2 rounded-xl bg-indigo-50 p-3"><input className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm" placeholder="Customer name" value={quickCustomer.name} onChange={(event) => setQuickCustomer({ ...quickCustomer, name: event.target.value })} /><input className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm" placeholder="Email address" type="email" value={quickCustomer.email} onChange={(event) => setQuickCustomer({ ...quickCustomer, email: event.target.value })} /><button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white" type="button" disabled={quickCustomerMutation.isPending} onClick={() => quickCustomerMutation.mutate(quickCustomer)}>{quickCustomerMutation.isPending ? 'Adding...' : 'Add and select customer'}</button></div> : null}
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Staff member
              <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          value={form.staffId}
          onChange={(event) => setForm((prev) => ({ ...prev, staffId: event.target.value }))}
          required
              ><option value="">Select staff</option>{staffQuery.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Service
              <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          value={form.serviceId}
          onChange={(event) => setForm((prev) => ({ ...prev, serviceId: event.target.value }))}
          required
              ><option value="">Select service</option>{servicesQuery.data?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Room or resource <span className="font-normal text-slate-400">optional</span>
              <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.resourceId} onChange={(event) => setForm((prev) => ({ ...prev, resourceId: event.target.value }))}><option value="">No resource</option>{resourcesQuery.data?.filter((resource) => resource.active).map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}</select>
            </label>
            {selectedService ? <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">{selectedService.durationMinutes ?? 0} minutes · {selectedService.price ? `$${selectedService.price}` : 'Price not set'}</p> : null}
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Starts
              <input className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          type="datetime-local"
          value={form.startAtUtc}
          onChange={(event) => setForm((prev) => ({ ...prev, startAtUtc: event.target.value }))}
          required
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Ends
              <input className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          type="datetime-local"
          value={form.endAtUtc}
          onChange={(event) => setForm((prev) => ({ ...prev, endAtUtc: event.target.value }))}
          required
              />
            </label>
            <textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Notes"
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
            <button className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving appointment...' : 'Create appointment'}
            </button>
            {createMutation.isError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">This slot is unavailable or outside business hours. Choose another time.</p> : null}
          </div>
        </form>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Upcoming appointments</h3>
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700" type="button" onClick={() => void appointmentsQuery.refetch()}>Refresh</button>
          </div>
          <FilterBar onClear={clearFilters}>
            <SearchInput
              value={search}
              placeholder="Search customer, email, service, staff, notes..."
              onChange={(value) => { setSearch(value); setPage(0) }}
            />
            <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(0) }}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked in</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No-show</option>
            </select>
            <input className="min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="datetime-local" aria-label="From date and time" value={fromFilter} onChange={(event) => { setFromFilter(event.target.value); setPage(0) }} />
            <input className="min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="datetime-local" aria-label="To date and time" value={toFilter} onChange={(event) => { setToFilter(event.target.value); setPage(0) }} />
            <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={staffFilter} onChange={(event) => { setStaffFilter(event.target.value); setPage(0) }}>
              <option value="">All staff</option>
              {staffQuery.data?.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
            </select>
            <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={serviceFilter} onChange={(event) => { setServiceFilter(event.target.value); setPage(0) }}>
              <option value="">All services</option>
              {servicesQuery.data?.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
            <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={resourceFilter} onChange={(event) => { setResourceFilter(event.target.value); setPage(0) }}>
              <option value="">All resources</option>
              {resourcesQuery.data?.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
            </select>
          </FilterBar>

          <ListState
            loading={appointmentsQuery.isLoading}
            error={appointmentsQuery.isError}
            empty={!visibleAppointments.length}
            loadingMessage="Loading appointments..."
            emptyMessage="No appointments match the current filters."
          >
            <div className="grid gap-3">
        {visibleAppointments.map((appointment) => (
          <div key={appointment.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{customersQuery.data?.find((customer) => customer.id === appointment.customerId)?.name ?? 'Customer'}</p>
                <p className="mt-1 text-sm text-slate-500">{appointment.startTime || 'Time not set'} – {appointment.endTime || 'Time not set'}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{appointment.status || 'Pending'}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{servicesQuery.data?.find((service) => service.id === appointment.serviceId)?.name ?? 'Service not found'} · {staffQuery.data?.find((staff) => staff.id === appointment.staffId)?.name ?? 'Staff member not found'}</p>
            <div className="mt-4 flex gap-2">
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                type="button"
                onClick={() => setRescheduleDraft({
                  appointmentId: appointment.id,
                  startTime: appointment.startTime,
                  endTime: appointment.endTime,
                })}
                disabled={rescheduleMutation.isPending}
              >
                Reschedule
              </button>
              {nextStatuses(appointment.status).map(({ status, label }) => (
                <button
                  className={status === 'CANCELLED'
                    ? 'rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50'
                    : 'rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50'}
                  type="button"
                  key={status}
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ appointmentId: appointment.id, status })}
                >
                  {label}
                </button>
              ))}
              <button className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                type="button"
                onClick={() => { setPaymentAppointmentId(appointment.id); setPaymentAmount('') }}
              >
                Payment
              </button>
            </div>
            {statusMutation.isError ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">That status change is not allowed.</p> : null}
            {rescheduleDraft?.appointmentId === appointment.id ? (
              <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  New start
                  <input className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm" type="datetime-local" value={rescheduleDraft.startTime} onChange={(event) => setRescheduleDraft((draft) => draft ? { ...draft, startTime: event.target.value } : draft)} />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  New end
                  <input className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm" type="datetime-local" value={rescheduleDraft.endTime} onChange={(event) => setRescheduleDraft((draft) => draft ? { ...draft, endTime: event.target.value } : draft)} />
                </label>
                <button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700" type="button" disabled={rescheduleMutation.isPending} onClick={() => rescheduleMutation.mutate({ appointmentId: appointment.id, startAtUtc: rescheduleDraft.startTime, endAtUtc: rescheduleDraft.endTime })}>
                  {rescheduleMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white" type="button" onClick={() => setRescheduleDraft(null)}>
                  Close
                </button>
              </div>
            ) : null}
            {rescheduleMutation.isError ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">That time is unavailable. Choose another slot.</p> : null}
          </div>
        ))}
            </div>
          </ListState>
          <Pagination
            page={appointmentsQuery.data?.number ?? 0}
            totalPages={appointmentsQuery.data?.totalPages ?? 0}
            onPageChange={setPage}
          />
        </section>
      </div>
      {paymentAppointmentId ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/50 p-5" role="dialog" aria-modal="true">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-semibold text-emerald-600">Appointment payment</p><h3 className="mt-1 text-xl font-bold text-slate-900">Record deposit or payment</h3></div>
              <button className="text-sm font-semibold text-slate-500" type="button" onClick={() => setPaymentAppointmentId(null)}>Close</button>
            </div>
            {paymentQuery.isLoading ? <p className="mt-5 text-sm text-slate-500">Loading payment...</p> : paymentQuery.data ? <div className="mt-5 grid gap-4">
              <div className="grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">Total</p><p className="mt-1 font-bold text-slate-900">${paymentQuery.data.amountDue.toFixed(2)}</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-slate-500">Paid</p><p className="mt-1 font-bold text-emerald-700">${paymentQuery.data.amountPaid.toFixed(2)}</p></div><div className="rounded-lg bg-amber-50 p-3"><p className="text-slate-500">Balance</p><p className="mt-1 font-bold text-amber-700">${paymentQuery.data.balance.toFixed(2)}</p></div></div>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">Amount received<input className="rounded-lg border border-slate-300 px-3 py-2.5" type="number" min="0" max={paymentQuery.data.amountDue} step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="0.00" /></label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">Payment method<select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="CASH">Cash</option><option value="CARD">Card</option><option value="TRANSFER">Bank transfer</option><option value="OTHER">Other</option></select></label>
              <button className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700" type="button" disabled={paymentMutation.isPending || !paymentAmount} onClick={() => paymentMutation.mutate()}>{paymentMutation.isPending ? 'Saving...' : 'Save payment'}</button>
              <button className="rounded-lg border border-indigo-200 px-4 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-50" type="button" disabled={checkoutMutation.isPending || paymentQuery.data.balance <= 0} onClick={() => checkoutMutation.mutate()}>{checkoutMutation.isPending ? 'Opening checkout...' : 'Pay online with Stripe'}</button>
              {paymentMutation.isError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">The payment could not be recorded.</p> : null}
              {checkoutMutation.isError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">Stripe checkout is not configured or unavailable.</p> : null}
              <p className="text-xs text-slate-500">Receipt: {paymentQuery.data.receiptNumber} · Status: {paymentQuery.data.status.replace('_', ' ')}</p>
            </div> : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}
