import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  createAppointment,
  rescheduleAppointment,
  searchAppointments,
  updateAppointmentStatus,
} from '../appointmentsApi'
import { createCustomer, fetchCustomersPage, searchCustomers } from '../../customers/customersApi'
import { fetchStaffPage, searchStaff } from '../../staff/staffApi'
import { fetchServicesPage, searchServices } from '../../services/servicesApi'
import { fetchResourcesPage, searchResources } from '../../resources/resourcesApi'
import { fetchPublicSlots, type PublicSlot } from '../../booking/publicBookingApi'
import { fetchAppointmentPayment, fetchPaymentHistory, recordAppointmentPayment, refundAppointmentPayment } from '../paymentsApi'
import { createStripeCheckout } from '../paymentsApi'
import { FilterBar } from '../../../shared/components/FilterBar'
import { ListState } from '../../../shared/components/ListState'
import { Pagination } from '../../../shared/components/Pagination'
import { SearchInput } from '../../../shared/components/SearchInput'
import type { AppointmentStatus } from '../types'
import { useAuthStore } from '../../auth/authStore'
import { formatAppointmentDateTime, formatAppointmentTime, fromDateTimeLocal, toDateTimeLocal, validateDateTimeRange } from '../dateTime'
import { FiCalendar, FiCreditCard, FiFilter, FiInfo, FiPlus, FiPrinter, FiRefreshCw, FiSave, FiX } from 'react-icons/fi'
import { AsyncCombobox } from '../../../shared/components/AsyncCombobox'
import { useToast } from '../../../shared/components/ToastProvider'
import { getApiErrorMessage } from '../../../shared/api/apiError'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'

function localDateInTimezone(timezone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
}

export function AppointmentsPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const user = useAuthStore((state) => state.user)
  const timezone = user?.timezone ?? 'UTC'
  const tenantId = user?.tenantId ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState({
    customerId: '',
    staffId: '',
    serviceId: '',
    resourceId: '',
    startAtUtc: '',
    endAtUtc: '',
    notes: '',
  })
  const [availabilityDate, setAvailabilityDate] = useState(() => localDateInTimezone(timezone))
  const [rescheduleDraft, setRescheduleDraft] = useState<{
    appointmentId: string
    staffId: string
    serviceId: string
    date: string
    startTime: string
    endTime: string
  } | null>(null)
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '')
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '')
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? '')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(() => searchParams.get('paymentStatus') ?? '')
  const [fromFilter, setFromFilter] = useState(() => searchParams.get('from') ?? '')
  const [toFilter, setToFilter] = useState(() => searchParams.get('to') ?? '')
  const [staffFilter, setStaffFilter] = useState(() => searchParams.get('staffId') ?? '')
  const [serviceFilter, setServiceFilter] = useState(() => searchParams.get('serviceId') ?? '')
  const [resourceFilter, setResourceFilter] = useState('')
  const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') ?? 'startTime')
  const [direction, setDirection] = useState<'asc' | 'desc'>(() => searchParams.get('direction') === 'desc' ? 'desc' : 'asc')
  const [page, setPage] = useState(() => {
    const value = Number(searchParams.get('page') ?? '0')
    return Number.isInteger(value) && value >= 0 ? value : 0
  })
  const [pageSize, setPageSize] = useState(() => {
    const value = Number(searchParams.get('pageSize') ?? '20')
    return [10, 20, 50].includes(value) ? value : 20
  })
  const [showQuickCustomer, setShowQuickCustomer] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [quickCustomer, setQuickCustomer] = useState({ name: '', email: '' })
  const [paymentAppointmentId, setPaymentAppointmentId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)

  useEscapeKey(Boolean(showCreateModal || showFilters || rescheduleDraft || selectedAppointmentId || paymentAppointmentId), () => {
    if (showCreateModal) setShowCreateModal(false)
    else if (showFilters) setShowFilters(false)
    else if (rescheduleDraft) setRescheduleDraft(null)
    else if (selectedAppointmentId) setSelectedAppointmentId(null)
    else setPaymentAppointmentId(null)
  })

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const normalizedSearch = searchInput.trim()
      setSearch(normalizedSearch)
      setPage(0)
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        if (normalizedSearch) next.set('search', normalizedSearch)
        else next.delete('search')
        return next
      }, { replace: true })
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [searchInput, setSearchParams])

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (fromFilter) next.set('from', fromFilter)
      else next.delete('from')
      if (toFilter) next.set('to', toFilter)
      else next.delete('to')
      return next
    }, { replace: true })
  }, [fromFilter, toFilter, setSearchParams])

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (statusFilter) next.set('status', statusFilter)
      else next.delete('status')
      return next
    }, { replace: true })
  }, [statusFilter, setSearchParams])

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (staffFilter) next.set('staffId', staffFilter)
      else next.delete('staffId')
      return next
    }, { replace: true })
  }, [staffFilter, setSearchParams])

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (serviceFilter) next.set('serviceId', serviceFilter)
      else next.delete('serviceId')
      return next
    }, { replace: true })
  }, [serviceFilter, setSearchParams])

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (paymentStatusFilter) next.set('paymentStatus', paymentStatusFilter)
      else next.delete('paymentStatus')
      return next
    }, { replace: true })
  }, [paymentStatusFilter, setSearchParams])

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (sortBy !== 'startTime') next.set('sortBy', sortBy)
      else next.delete('sortBy')
      if (direction !== 'asc') next.set('direction', direction)
      else next.delete('direction')
      return next
    }, { replace: true })
  }, [direction, setSearchParams, sortBy])

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (page > 0) next.set('page', String(page))
      else next.delete('page')
      return next
    }, { replace: true })
  }, [page, setSearchParams])

  useEffect(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (pageSize !== 20) next.set('pageSize', String(pageSize))
      else next.delete('pageSize')
      return next
    }, { replace: true })
  }, [pageSize, setSearchParams])

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', search, statusFilter, fromFilter, toFilter, staffFilter, serviceFilter, resourceFilter, paymentStatusFilter, sortBy, direction, page, pageSize],
    queryFn: () => searchAppointments({
      search,
      status: statusFilter,
      paymentStatus: paymentStatusFilter,
      staffId: staffFilter,
      serviceId: serviceFilter,
      resourceId: resourceFilter,
      from: fromFilter || undefined,
      to: toFilter || undefined,
      page,
      size: pageSize,
      sortBy,
      direction,
    }),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  })
  const availabilityQuery = useQuery<PublicSlot[]>({
    queryKey: ['appointment-availability', tenantId, availabilityDate, form.serviceId, form.staffId, timezone],
    queryFn: () => fetchPublicSlots(tenantId, availabilityDate, form.serviceId, form.staffId),
    enabled: showCreateModal && Boolean(tenantId && availabilityDate && form.serviceId && form.staffId),
  })
  const rescheduleAvailabilityQuery = useQuery<PublicSlot[]>({
    queryKey: ['reschedule-availability', tenantId, rescheduleDraft?.date, rescheduleDraft?.serviceId, rescheduleDraft?.staffId],
    queryFn: () => fetchPublicSlots(tenantId, rescheduleDraft!.date, rescheduleDraft!.serviceId, rescheduleDraft!.staffId),
    enabled: Boolean(tenantId && rescheduleDraft?.date && rescheduleDraft.serviceId && rescheduleDraft.staffId),
  })
  const customersQuery = useQuery({ queryKey: ['customers', 'lookup'], queryFn: () => fetchCustomersPage({ page: 0, size: 100, sortBy: 'name', direction: 'asc' }) })
  const staffQuery = useQuery({ queryKey: ['staff', 'lookup'], queryFn: () => fetchStaffPage({ page: 0, size: 100, sortBy: 'name', direction: 'asc' }) })
  const servicesQuery = useQuery({ queryKey: ['services', 'lookup'], queryFn: () => fetchServicesPage({ page: 0, size: 100, sortBy: 'name', direction: 'asc' }) })
  const resourcesQuery = useQuery({ queryKey: ['resources', 'lookup'], queryFn: () => fetchResourcesPage({ page: 0, size: 100, sortBy: 'name', direction: 'asc', active: 'true' }) })

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
      setAvailabilityDate(localDateInTimezone(timezone))
      setShowCreateModal(false)
      showToast('Appointment created successfully.', 'success')
    },
    onError: (error) => showToast(getApiErrorMessage(error), 'error'),
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
      showToast('Appointment rescheduled successfully.', 'success')
    },
    onError: (error) => showToast(getApiErrorMessage(error), 'error'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(appointmentId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
      showToast('Appointment status updated.', 'success')
    },
    onError: (error) => showToast(getApiErrorMessage(error), 'error'),
  })
  const quickCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (customer) => {
      setForm((previous) => ({ ...previous, customerId: customer.id }))
      setQuickCustomer({ name: '', email: '' })
      setShowQuickCustomer(false)
      void queryClient.invalidateQueries({ queryKey: ['customers'] })
      showToast('Customer added and selected.', 'success')
    },
    onError: (error) => showToast(getApiErrorMessage(error), 'error'),
  })
  const paymentQuery = useQuery({
    queryKey: ['appointment-payment', paymentAppointmentId],
    queryFn: () => fetchAppointmentPayment(paymentAppointmentId!),
    enabled: Boolean(paymentAppointmentId),
  })
  const paymentHistoryQuery = useQuery({
    queryKey: ['appointment-payment-history', paymentAppointmentId],
    queryFn: () => fetchPaymentHistory(paymentAppointmentId!),
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
      void queryClient.invalidateQueries({ queryKey: ['appointment-payment-history', paymentAppointmentId] })
      setPaymentAmount('')
      showToast('Payment recorded successfully.', 'success')
    },
    onError: (error) => showToast(getApiErrorMessage(error), 'error'),
  })
  const refundMutation = useMutation({
    mutationFn: () => refundAppointmentPayment(paymentAppointmentId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['appointment-payment', paymentAppointmentId] })
      void queryClient.invalidateQueries({ queryKey: ['appointment-payment-history', paymentAppointmentId] })
      showToast('Payment refunded successfully.', 'success')
    },
    onError: (error) => showToast(getApiErrorMessage(error), 'error'),
  })
  const checkoutMutation = useMutation({
    mutationFn: () => createStripeCheckout(paymentAppointmentId!),
    onSuccess: ({ checkoutUrl }) => { window.location.assign(checkoutUrl) },
  })

  const customers = customersQuery.data?.content ?? []
  const staff = staffQuery.data?.content ?? []
  const services = servicesQuery.data?.content ?? []
  const resources = resourcesQuery.data?.content ?? []
  const selectedService = services.find((service) => service.id === form.serviceId)
  const visibleAppointments = appointmentsQuery.data?.content ?? []
  const totalAppointments = appointmentsQuery.data?.totalElements ?? 0
  const firstVisibleAppointment = totalAppointments === 0
    ? 0
    : (appointmentsQuery.data?.number ?? 0) * (appointmentsQuery.data?.size ?? 10) + 1
  const lastVisibleAppointment = totalAppointments === 0
    ? 0
    : firstVisibleAppointment + visibleAppointments.length - 1
  const activeFilterCount = [search, statusFilter, paymentStatusFilter, fromFilter, toFilter, staffFilter, serviceFilter, resourceFilter].filter(Boolean).length

  function clearFilters() {
    setSearchInput('')
    setSearch('')
    setStatusFilter('')
    setPaymentStatusFilter('')
    setSortBy('startTime')
    setDirection('asc')
    setFromFilter('')
    setToFilter('')
    setStaffFilter('')
    setServiceFilter('')
    setResourceFilter('')
    setPage(0)
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const key of ['search', 'from', 'to', 'status', 'staffId', 'serviceId', 'resourceId', 'paymentStatus', 'sortBy', 'direction', 'page']) {
        next.delete(key)
      }
      return next
    }, { replace: true })
  }

  function nextStatuses(status: AppointmentStatus): Array<{ status: AppointmentStatus; label: string }> {
    if (status === 'PENDING') return [{ status: 'CONFIRMED', label: 'Confirm' }, { status: 'CANCELLED', label: 'Cancel' }]
    if (status === 'CONFIRMED') return [{ status: 'CHECKED_IN', label: 'Check in' }, { status: 'COMPLETED', label: 'Complete' }, { status: 'NO_SHOW', label: 'No-show' }, { status: 'CANCELLED', label: 'Cancel' }]
    if (status === 'CHECKED_IN') return [{ status: 'COMPLETED', label: 'Complete' }, { status: 'CANCELLED', label: 'Cancel' }]
    return []
  }

  function statusBadgeClass(status: AppointmentStatus) {
    if (status === 'CANCELLED') return 'bg-rose-50 text-rose-700'
    if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700'
    if (status === 'NO_SHOW') return 'bg-amber-50 text-amber-700'
    if (status === 'CHECKED_IN') return 'bg-violet-50 text-violet-700'
    return 'bg-indigo-50 text-indigo-700'
  }

  function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateDateTimeRange(form.startAtUtc, form.endAtUtc)
    if (validationError) {
      showToast(validationError, 'error')
      return
    }
    createMutation.mutate({
      ...form,
      startAtUtc: fromDateTimeLocal(form.startAtUtc, timezone),
      endAtUtc: fromDateTimeLocal(form.endAtUtc, timezone),
    })
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
          {totalAppointments === 0
            ? '0 matching'
            : `${firstVisibleAppointment}-${lastVisibleAppointment} of ${totalAppointments} matching`}
        </span>
      </div>

      <div className="space-y-6">
        {showCreateModal ? <div className="fixed inset-0 z-40 bg-slate-950/50" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreateModal(false) }} /> : null}
        <form data-tour="appointment-create" className={showCreateModal ? 'fixed inset-x-4 top-4 z-50 mx-auto flex max-h-[calc(100vh-2rem)] w-auto max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:inset-x-8 sm:top-8 sm:max-h-[calc(100vh-4rem)]' : 'hidden'} onSubmit={onCreate} role={showCreateModal ? 'dialog' : undefined} aria-modal={showCreateModal ? true : undefined} aria-labelledby={showCreateModal ? 'create-appointment-title' : undefined}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
            <div><h3 id="create-appointment-title" className="text-lg font-semibold text-slate-900">New appointment</h3><p className="mt-1 text-sm text-slate-500">Choose the customer, service, team member, and time.</p></div>
            <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={() => setShowCreateModal(false)}>Close</button>
          </div>
          <div className="overflow-y-auto p-5 sm:p-6">
          <p className="mt-1 text-sm text-slate-500">Choose people and services by name. IDs are handled automatically.</p>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Customer
              <AsyncCombobox value={form.customerId} selectedLabel={customers.find((customer) => customer.id === form.customerId)?.name} placeholder="Search customers..." queryKey="customers" loadOptions={searchCustomers} getOptionValue={(customer) => customer.id} getOptionLabel={(customer) => `${customer.name} · ${customer.email}`} onChange={(value) => setForm((prev) => ({ ...prev, customerId: value }))} required />
              <button className="text-left text-xs font-semibold text-indigo-600 hover:text-indigo-700" type="button" onClick={() => setShowQuickCustomer((visible) => !visible)}>+ Add new customer</button>
            </label>
            {showQuickCustomer ? <div className="grid gap-2 rounded-xl bg-indigo-50 p-3"><input className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm" placeholder="Customer name" value={quickCustomer.name} onChange={(event) => setQuickCustomer({ ...quickCustomer, name: event.target.value })} /><input className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm" placeholder="Email address" type="email" value={quickCustomer.email} onChange={(event) => setQuickCustomer({ ...quickCustomer, email: event.target.value })} /><button className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white" type="button" disabled={quickCustomerMutation.isPending} onClick={() => quickCustomerMutation.mutate(quickCustomer)}>{quickCustomerMutation.isPending ? 'Adding...' : 'Add and select customer'}</button></div> : null}
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Staff member
              <AsyncCombobox value={form.staffId} selectedLabel={staff.find((member) => member.id === form.staffId)?.name} placeholder="Search staff..." queryKey="staff" loadOptions={searchStaff} getOptionValue={(member) => member.id} getOptionLabel={(member) => member.name} onChange={(value) => setForm((prev) => ({ ...prev, staffId: value, startAtUtc: '', endAtUtc: '' }))} required />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Service
              <AsyncCombobox value={form.serviceId} selectedLabel={services.find((service) => service.id === form.serviceId)?.name} placeholder="Search services..." queryKey="services" loadOptions={searchServices} getOptionValue={(service) => service.id} getOptionLabel={(service) => service.name} onChange={(value) => setForm((prev) => ({ ...prev, serviceId: value, startAtUtc: '', endAtUtc: '' }))} required />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Room or resource <span className="font-normal text-slate-400">optional</span>
              <AsyncCombobox value={form.resourceId} selectedLabel={resources.find((resource) => resource.id === form.resourceId)?.name} placeholder="Search resources (optional)..." queryKey="resources" loadOptions={searchResources} getOptionValue={(resource) => resource.id} getOptionLabel={(resource) => resource.name} onChange={(value) => setForm((prev) => ({ ...prev, resourceId: value }))} />
            </label>
            {selectedService ? <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">{selectedService.durationMinutes ?? 0} minutes · {selectedService.price ? `$${selectedService.price}` : 'Price not set'}</p> : null}
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Date
              <input
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                type="date"
                min={localDateInTimezone(timezone)}
                value={availabilityDate}
                onChange={(event) => {
                  setAvailabilityDate(event.target.value)
                  setForm((prev) => ({ ...prev, startAtUtc: '', endAtUtc: '' }))
                }}
                required
              />
              <span className="text-xs font-normal text-slate-500">Times shown in {timezone}.</span>
            </label>
            <div className="grid gap-2">
              <p className="text-sm font-medium text-slate-700">Available times</p>
              {!form.serviceId || !form.staffId ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">Select a service and staff member first.</p> : null}
              {form.serviceId && form.staffId && availabilityQuery.isLoading ? <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">Finding available times...</p> : null}
              {form.serviceId && form.staffId && availabilityQuery.isError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">Availability could not be loaded. <button className="font-semibold underline" type="button" onClick={() => void availabilityQuery.refetch()}>Try again</button></p> : null}
              {form.serviceId && form.staffId && !availabilityQuery.isLoading && !availabilityQuery.isError && !availabilityQuery.data?.length ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">No available times for this date. Choose another date.</p> : null}
              {availabilityQuery.data?.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {availabilityQuery.data.map((slot) => {
                    const selected = form.startAtUtc === toDateTimeLocal(slot.startTime, timezone)
                    return (
                      <button
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-indigo-400'}`}
                        type="button"
                        key={slot.startTime}
                        onClick={() => setForm((prev) => ({
                          ...prev,
                          startAtUtc: toDateTimeLocal(slot.startTime, timezone),
                          endAtUtc: toDateTimeLocal(slot.endTime, timezone),
                        }))}
                      >
                        {formatAppointmentTime(slot.startTime, timezone)}
                      </button>
                    )
                  })}
                </div>
              ) : null}
              {form.startAtUtc ? <p className="text-xs font-medium text-emerald-700">Selected: {formatAppointmentDateTime(fromDateTimeLocal(form.startAtUtc, timezone), timezone)} ({selectedService?.durationMinutes ?? 0} minutes)</p> : null}
            </div>
            <textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="Notes"
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            />
            <button className="rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={createMutation.isPending || !form.startAtUtc || !form.endAtUtc}>
              {createMutation.isPending ? 'Saving appointment...' : 'Create appointment'}
            </button>
            {createMutation.isError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">This slot is unavailable or outside business hours. Choose another time.</p> : null}
          </div>
          </div>
        </form>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Upcoming appointments</h3>
            <div className="flex items-center gap-2">
              <button data-tour="appointment-filters" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={() => setShowFilters(true)}>
                <FiFilter aria-hidden="true" />Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
              </button>
              <button data-tour="appointment-new" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700" type="button" onClick={() => setShowCreateModal(true)}><FiPlus aria-hidden="true" />New appointment</button>
              <button className="hidden items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 sm:inline-flex" type="button" onClick={() => void appointmentsQuery.refetch()}><FiRefreshCw aria-hidden="true" />Refresh</button>
            </div>
          </div>
          {activeFilterCount ? <p className="mb-3 text-sm text-slate-500">{activeFilterCount} filter{activeFilterCount === 1 ? '' : 's'} applied.</p> : null}
          {showFilters ? <div className="fixed inset-0 z-40 bg-slate-950/50" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowFilters(false) }}>
            <aside className="absolute inset-y-0 right-0 w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-6" role="dialog" aria-modal="true" aria-labelledby="appointment-filters-title">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div><p className="text-sm font-semibold text-indigo-600">Narrow results</p><h3 id="appointment-filters-title" className="mt-1 text-2xl font-bold text-slate-900">Filters and sorting</h3><p className="mt-1 text-sm text-slate-500">Choose only the criteria you need.</p></div>
                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={() => setShowFilters(false)}>Close</button>
              </div>
              <FilterBar onClear={clearFilters}>
            <SearchInput
              value={searchInput}
              placeholder="Search customer, email, service, staff, notes..."
              onChange={setSearchInput}
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
            <input className="min-w-0 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="datetime-local" aria-label="To date and time" value={toFilter} min={fromFilter || undefined} onChange={(event) => { setToFilter(event.target.value); setPage(0) }} />
            <AsyncCombobox value={staffFilter} selectedLabel={staff.find((member) => member.id === staffFilter)?.name} placeholder="All staff" queryKey="staff-filter" loadOptions={searchStaff} getOptionValue={(member) => member.id} getOptionLabel={(member) => member.name} onChange={(value) => { setStaffFilter(value); setPage(0) }} />
            <AsyncCombobox value={serviceFilter} selectedLabel={services.find((service) => service.id === serviceFilter)?.name} placeholder="All services" queryKey="service-filter" loadOptions={searchServices} getOptionValue={(service) => service.id} getOptionLabel={(service) => service.name} onChange={(value) => { setServiceFilter(value); setPage(0) }} />
            <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={paymentStatusFilter} onChange={(event) => { setPaymentStatusFilter(event.target.value); setPage(0) }}>
              <option value="">All payment statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially paid</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={sortBy} aria-label="Sort appointments by" onChange={(event) => { setSortBy(event.target.value); setPage(0) }}>
              <option value="startTime">Sort by start time</option>
              <option value="endTime">Sort by end time</option>
              <option value="status">Sort by status</option>
              <option value="createdAt">Sort by created time</option>
              <option value="updatedAt">Sort by updated time</option>
            </select>
            <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={direction} aria-label="Sort direction" onChange={(event) => { setDirection(event.target.value === 'desc' ? 'desc' : 'asc'); setPage(0) }}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
            <AsyncCombobox value={resourceFilter} selectedLabel={resources.find((resource) => resource.id === resourceFilter)?.name} placeholder="All resources" queryKey="resource-filter" loadOptions={searchResources} getOptionValue={(resource) => resource.id} getOptionLabel={(resource) => resource.name} onChange={(value) => { setResourceFilter(value); setPage(0) }} />
              </FilterBar>
            </aside>
          </div> : null}

          <Pagination
             page={appointmentsQuery.data?.number ?? 0}
             totalPages={appointmentsQuery.data?.totalPages ?? 0}
             totalElements={appointmentsQuery.data?.totalElements}
             pageSize={pageSize}
             onPageChange={setPage}
             onPageSizeChange={(size) => { setPage(0); setPageSize(size) }}
          />

          <ListState
             loading={appointmentsQuery.isLoading}
             error={appointmentsQuery.isError}
            empty={!visibleAppointments.length}
            loadingMessage="Loading appointments..."
            emptyMessage="No appointments match the current filters."
            onRetry={() => void appointmentsQuery.refetch()}
          >
            <div className="grid gap-3">
        {visibleAppointments.map((appointment) => (
          <div key={appointment.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{customers.find((customer) => customer.id === appointment.customerId)?.name ?? 'Customer'}</p>
                <p className="mt-1 text-sm text-slate-500">{appointment.startTime ? formatAppointmentDateTime(appointment.startTime, timezone) : 'Start time not set'} – {appointment.endTime ? formatAppointmentTime(appointment.endTime, timezone) : 'End time not set'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button data-tour="appointment-details" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white" type="button" onClick={() => setSelectedAppointmentId(appointment.id)}><FiInfo aria-hidden="true" />Details</button>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(appointment.status)}`}>{appointment.status?.replaceAll('_', ' ') || 'Pending'}</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-600">{services.find((service) => service.id === appointment.serviceId)?.name ?? 'Service not found'} · {staff.find((member) => member.id === appointment.staffId)?.name ?? 'Staff member not found'}</p>
            <div className="mt-4 flex gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                type="button"
                onClick={() => setRescheduleDraft({
                  appointmentId: appointment.id,
                  staffId: appointment.staffId,
                  serviceId: appointment.serviceId,
                  date: toDateTimeLocal(appointment.startTime, timezone).slice(0, 10),
                  startTime: toDateTimeLocal(appointment.startTime, timezone),
                  endTime: toDateTimeLocal(appointment.endTime, timezone),
                })}
                disabled={rescheduleMutation.isPending}
              >
                <><FiCalendar aria-hidden="true" />Reschedule</>
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
              <button className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                type="button"
                onClick={() => { setPaymentAppointmentId(appointment.id); setPaymentAmount('') }}
              >
                <><FiCreditCard aria-hidden="true" />Payment</>
              </button>
            </div>
            {statusMutation.isError ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">That status change is not allowed.</p> : null}
            {rescheduleDraft?.appointmentId === appointment.id ? (
              <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[auto_1fr_auto_auto] sm:items-end">
                <label className="grid gap-1 text-xs font-semibold text-slate-600">
                  Date
                  <input
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm"
                    type="date"
                    min={localDateInTimezone(timezone)}
                    value={rescheduleDraft.date}
                    onChange={(event) => setRescheduleDraft((draft) => draft ? { ...draft, date: event.target.value, startTime: '', endTime: '' } : draft)}
                  />
                </label>
                <div className="grid gap-2 sm:col-span-1">
                  <p className="text-xs font-semibold text-slate-600">Available times</p>
                  {rescheduleAvailabilityQuery.isLoading ? <p className="text-xs text-slate-500">Finding available times...</p> : null}
                  {rescheduleAvailabilityQuery.isError ? <p className="text-xs text-rose-700">Could not load availability. <button className="font-semibold underline" type="button" onClick={() => void rescheduleAvailabilityQuery.refetch()}>Try again</button></p> : null}
                  {!rescheduleAvailabilityQuery.isLoading && !rescheduleAvailabilityQuery.isError && !rescheduleAvailabilityQuery.data?.length ? <p className="text-xs text-amber-700">No available times for this date.</p> : null}
                  {rescheduleAvailabilityQuery.data?.length ? <div className="flex flex-wrap gap-2">{rescheduleAvailabilityQuery.data.map((slot) => <button className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${rescheduleDraft.startTime === toDateTimeLocal(slot.startTime, timezone) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`} type="button" key={slot.startTime} onClick={() => setRescheduleDraft((draft) => draft ? { ...draft, startTime: toDateTimeLocal(slot.startTime, timezone), endTime: toDateTimeLocal(slot.endTime, timezone) } : draft)}>{formatAppointmentTime(slot.startTime, timezone)}</button>)}</div> : null}
                </div>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50" type="button" disabled={rescheduleMutation.isPending || !rescheduleDraft.startTime || !rescheduleDraft.endTime} onClick={() => { const validationError = validateDateTimeRange(rescheduleDraft.startTime, rescheduleDraft.endTime); if (validationError) { showToast(validationError, 'error'); return }; rescheduleMutation.mutate({ appointmentId: appointment.id, startAtUtc: fromDateTimeLocal(rescheduleDraft.startTime, timezone), endAtUtc: fromDateTimeLocal(rescheduleDraft.endTime, timezone) }) }}>
                  <FiSave aria-hidden="true" />{rescheduleMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white" type="button" onClick={() => setRescheduleDraft(null)}>
                  <><FiX aria-hidden="true" />Close</>
                </button>
              </div>
            ) : null}
            {rescheduleMutation.isError ? <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">That time is unavailable. Choose another slot.</p> : null}
          </div>
        ))}
            </div>
          </ListState>
        </section>
      </div>
      {selectedAppointmentId ? (() => {
        const appointment = visibleAppointments.find((item) => item.id === selectedAppointmentId)
        if (!appointment) return null
        const customer = customers.find((item) => item.id === appointment.customerId)
        const staffMember = staff.find((item) => item.id === appointment.staffId)
        const service = services.find((item) => item.id === appointment.serviceId)
        const resource = resources.find((item) => item.id === appointment.resourceId)
        return (
          <div className="fixed inset-0 z-30 bg-slate-950/40" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedAppointmentId(null) }}>
            <aside className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="appointment-details-title">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-sm font-semibold text-indigo-600">Appointment details</p><h3 id="appointment-details-title" className="mt-1 text-2xl font-bold text-slate-900">{customer?.name ?? 'Customer'}</h3></div>
                <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={() => setSelectedAppointmentId(null)}><FiX aria-hidden="true" />Close</button>
              </div>
              <dl className="mt-6 grid gap-4 text-sm">
                <div><dt className="font-semibold text-slate-500">Status</dt><dd className="mt-1 text-slate-900">{appointment.status.replaceAll('_', ' ')}</dd></div>
                <div><dt className="font-semibold text-slate-500">When</dt><dd className="mt-1 text-slate-900">{formatAppointmentDateTime(appointment.startTime, timezone)} - {formatAppointmentTime(appointment.endTime, timezone)}</dd></div>
                <div><dt className="font-semibold text-slate-500">Service</dt><dd className="mt-1 text-slate-900">{service?.name ?? 'Service not found'}</dd></div>
                <div><dt className="font-semibold text-slate-500">Staff</dt><dd className="mt-1 text-slate-900">{staffMember?.name ?? 'Staff member not found'}</dd></div>
                <div><dt className="font-semibold text-slate-500">Resource</dt><dd className="mt-1 text-slate-900">{resource?.name ?? 'No resource assigned'}</dd></div>
                <div><dt className="font-semibold text-slate-500">Customer email</dt><dd className="mt-1 text-slate-900">{customer?.email ?? 'Not provided'}</dd></div>
                <div><dt className="font-semibold text-slate-500">Notes</dt><dd className="mt-1 whitespace-pre-wrap text-slate-900">{appointment.notes || 'No notes'}</dd></div>
              </dl>
              <div className="mt-8 border-t border-slate-200 pt-5">
                <p className="text-sm font-semibold text-slate-700">Quick actions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50" type="button"                   onClick={() => { const startTime = toDateTimeLocal(appointment.startTime, timezone); setRescheduleDraft({ appointmentId: appointment.id, staffId: appointment.staffId, serviceId: appointment.serviceId, date: startTime.slice(0, 10), startTime, endTime: toDateTimeLocal(appointment.endTime, timezone) }); setSelectedAppointmentId(null) }} disabled={rescheduleMutation.isPending}>Reschedule</button>
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
                </div>
              </div>
            </aside>
          </div>
        )
      })() : null}
      {paymentAppointmentId ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/50 p-5" role="dialog" aria-modal="true">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-semibold text-emerald-600">Appointment payment</p><h3 className="mt-1 text-xl font-bold text-slate-900">Record deposit or payment</h3></div>
              <button className="text-sm font-semibold text-slate-500" type="button" onClick={() => setPaymentAppointmentId(null)}>Close</button>
            </div>
            {paymentQuery.isLoading ? <p className="mt-5 text-sm text-slate-500">Loading payment...</p> : paymentQuery.data ? <div className="mt-5 grid gap-4">
              <div className="grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">Total</p><p className="mt-1 font-bold text-slate-900">${paymentQuery.data.amountDue.toFixed(2)}</p></div><div className="rounded-lg bg-emerald-50 p-3"><p className="text-slate-500">Paid</p><p className="mt-1 font-bold text-emerald-700">${paymentQuery.data.amountPaid.toFixed(2)}</p></div><div className="rounded-lg bg-amber-50 p-3"><p className="text-slate-500">Balance</p><p className="mt-1 font-bold text-amber-700">${paymentQuery.data.balance.toFixed(2)}</p></div></div>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">Amount received<input className="rounded-lg border border-slate-300 px-3 py-2.5" type="number" min="0" max={paymentQuery.data.balance} step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="0.00" /></label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">Payment method<select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="CASH">Cash</option><option value="CARD">Card</option><option value="TRANSFER">Bank transfer</option><option value="OTHER">Other</option></select></label>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700" type="button" disabled={paymentMutation.isPending || !paymentAmount} onClick={() => paymentMutation.mutate()}><FiSave aria-hidden="true" />{paymentMutation.isPending ? 'Saving...' : 'Save payment'}</button>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 px-4 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-50" type="button" disabled={checkoutMutation.isPending || paymentQuery.data.balance <= 0} onClick={() => checkoutMutation.mutate()}><FiCreditCard aria-hidden="true" />{checkoutMutation.isPending ? 'Opening checkout...' : 'Pay online with Stripe'}</button>
              <button className="rounded-lg border border-rose-300 px-4 py-2.5 font-semibold text-rose-700 hover:bg-rose-50" type="button" disabled={refundMutation.isPending || paymentQuery.data.amountPaid <= 0} onClick={() => { if (window.confirm('Refund all recorded payments for this appointment?')) refundMutation.mutate() }}>{refundMutation.isPending ? 'Refunding...' : 'Refund payment'}</button>
              {paymentMutation.isError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">The payment could not be recorded.</p> : null}
              {checkoutMutation.isError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">Stripe checkout is not configured or unavailable.</p> : null}
              <div className="flex items-center justify-between gap-3 text-xs text-slate-500"><span>Receipt: {paymentQuery.data.receiptNumber} · Status: {paymentQuery.data.status.replace('_', ' ')}</span><button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-700" type="button" onClick={() => window.print()}><FiPrinter aria-hidden="true" />Print receipt</button></div>
              {refundMutation.isError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">The refund could not be completed.</p> : null}
              <div className="border-t border-slate-200 pt-4"><p className="text-sm font-semibold text-slate-800">Payment history</p><div className="mt-2 grid gap-2">{paymentHistoryQuery.isLoading ? <p className="text-xs text-slate-500">Loading payment history...</p> : paymentHistoryQuery.data?.length ? paymentHistoryQuery.data.map((item) => <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs" key={item.id}><span>{item.type} · {item.paymentMethod || '—'}</span><span>{item.amount.toFixed(2)} · {new Date(item.createdAt).toLocaleString()}</span></div>) : <p className="text-xs text-slate-500">No payment history yet.</p>}</div></div>
            </div> : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}
