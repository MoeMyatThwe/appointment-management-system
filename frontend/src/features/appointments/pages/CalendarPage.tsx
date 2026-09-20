import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { createAppointment, rescheduleAppointment, searchAppointments } from '../appointmentsApi'
import { fetchCustomersPage, searchCustomers } from '../../customers/customersApi'
import { fetchStaffPage, searchStaff } from '../../staff/staffApi'
import { fetchServicesPage, searchServices } from '../../services/servicesApi'
import { fetchResourcesPage, searchResources } from '../../resources/resourcesApi'
import { FilterBar } from '../../../shared/components/FilterBar'
import { ListState } from '../../../shared/components/ListState'
import { SearchInput } from '../../../shared/components/SearchInput'
import type { Appointment } from '../types'
import { useAuthStore } from '../../auth/authStore'
import { formatAppointmentDateTime, formatAppointmentTime, fromDateTimeLocal, toDateTimeLocal } from '../dateTime'
import { FiChevronLeft, FiChevronRight, FiPlus, FiTarget } from 'react-icons/fi'
import { AsyncCombobox } from '../../../shared/components/AsyncCombobox'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'

type CalendarView = 'day' | 'week' | 'month' | 'agenda'

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfWeek(date: Date) {
  const start = new Date(date)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  start.setHours(0, 0, 0, 0)
  return start
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function statusClass(status: string) {
  if (status === 'CANCELLED') return 'border-rose-500 bg-rose-50 text-rose-800'
  if (status === 'COMPLETED') return 'border-emerald-500 bg-emerald-50 text-emerald-800'
  if (status === 'NO_SHOW') return 'border-amber-500 bg-amber-50 text-amber-800'
  if (status === 'CHECKED_IN') return 'border-violet-500 bg-violet-50 text-violet-800'
  return 'border-indigo-500 bg-indigo-50 text-indigo-800'
}

export function CalendarPage() {
  const queryClient = useQueryClient()
  const timezone = useAuthStore((state) => state.user?.timezone ?? 'UTC')
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<CalendarView>(() => {
    const value = searchParams.get('view')
    if (value === 'day' || value === 'month' || value === 'agenda') return value
    return window.matchMedia('(max-width: 767px)').matches ? 'agenda' : 'week'
  })
  const [anchorDate, setAnchorDate] = useState(() => {
    const value = searchParams.get('date')
    const date = value ? new Date(`${value}T00:00:00`) : new Date()
    return Number.isNaN(date.getTime()) ? new Date() : date
  })
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '')
  const [status, setStatus] = useState(() => searchParams.get('status') ?? '')
  const [staffId, setStaffId] = useState(() => searchParams.get('staffId') ?? '')
  const [serviceId, setServiceId] = useState(() => searchParams.get('serviceId') ?? '')
  const [resourceId, setResourceId] = useState(() => searchParams.get('resourceId') ?? '')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [slot, setSlot] = useState<{ start: string; end: string } | null>(null)
  const [createForm, setCreateForm] = useState({ customerId: '', staffId: '', serviceId: '', resourceId: '', notes: '' })

  useEscapeKey(Boolean(slot || selected), () => {
    if (slot) setSlot(null)
    else setSelected(null)
  })

  const days = useMemo(() => {
    const first = view === 'day' || view === 'agenda'
      ? (view === 'day' ? new Date(anchorDate) : startOfWeek(anchorDate))
      : view === 'week' ? startOfWeek(anchorDate) : startOfWeek(startOfMonth(anchorDate))
    const count = view === 'day' ? 1 : view === 'month' ? 42 : 7
    return Array.from({ length: count }, (_, index) => {
      const day = new Date(first)
      day.setDate(first.getDate() + index)
      day.setHours(0, 0, 0, 0)
      return day
    })
  }, [anchorDate, view])

  const appointments = useQuery({
    queryKey: ['appointments', 'calendar', view, dateKey(days[0]), search, status, staffId, serviceId, resourceId],
    queryFn: () => searchAppointments({
      search,
      status,
      staffId,
      serviceId,
      resourceId,
      from: `${dateKey(days[0])}T00:00:00`,
      to: `${dateKey(days[days.length - 1])}T23:59:59`,
      page: 0,
      size: 100,
      sortBy: 'startTime',
      direction: 'asc',
    }),
  })
  const customers = useQuery({ queryKey: ['customers', 'calendar-lookup'], queryFn: () => fetchCustomersPage({ page: 0, size: 100, sortBy: 'name', direction: 'asc' }) })
  const staff = useQuery({ queryKey: ['staff', 'calendar-lookup'], queryFn: () => fetchStaffPage({ page: 0, size: 100, sortBy: 'name', direction: 'asc' }) })
  const services = useQuery({ queryKey: ['services', 'calendar-lookup'], queryFn: () => fetchServicesPage({ page: 0, size: 100, sortBy: 'name', direction: 'asc' }) })
  const resources = useQuery({ queryKey: ['resources', 'calendar-lookup'], queryFn: () => fetchResourcesPage({ page: 0, size: 100, sortBy: 'name', direction: 'asc', active: 'true' }) })
  const createMutation = useMutation({
    mutationFn: () => createAppointment({
      ...createForm,
      startAtUtc: slot!.start,
      endAtUtc: slot!.end,
    }),
    onSuccess: () => {
      setSlot(null)
      setCreateForm({ customerId: '', staffId: '', serviceId: '', resourceId: '', notes: '' })
      void queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
  const rescheduleMutation = useMutation({
    mutationFn: ({ appointment, day }: { appointment: Appointment; day: Date }) => {
      const localStart = toDateTimeLocal(appointment.startTime, timezone)
      const localEnd = toDateTimeLocal(appointment.endTime, timezone)
      const start = new Date(`1970-01-01T${localStart.slice(11)}`)
      const end = new Date(`1970-01-01T${localEnd.slice(11)}`)
      const nextStartLocal = `${dateKey(day)}T${localStart.slice(11)}`
      const nextEnd = new Date(start.getTime() + end.getTime() - start.getTime())
      const nextEndLocal = `${dateKey(day)}T${nextEnd.toTimeString().slice(0, 5)}`
      return rescheduleAppointment(appointment.id, fromDateTimeLocal(nextStartLocal, timezone), fromDateTimeLocal(nextEndLocal, timezone))
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  })

  function syncUrl(next: Partial<{ view: CalendarView; date: Date; search: string; status: string; staffId: string; serviceId: string; resourceId: string }>) {
    const values = { view, date: anchorDate, search, status, staffId, serviceId, resourceId, ...next }
    const params = new URLSearchParams()
    if (values.view !== 'week') params.set('view', values.view)
    params.set('date', dateKey(values.date))
    for (const [key, value] of Object.entries(values)) {
      if (key !== 'view' && key !== 'date' && typeof value === 'string' && value) params.set(key, value)
    }
    setSearchParams(params, { replace: true })
  }

  function changeView(next: CalendarView) {
    setView(next)
    syncUrl({ view: next })
  }

  function move(offset: number) {
    const next = new Date(anchorDate)
    next.setDate(next.getDate() + offset * (view === 'day' ? 1 : view === 'month' ? 30 : 7))
    setAnchorDate(next)
    syncUrl({ date: next })
  }

  function clearFilters() {
    setSearch('')
    setStatus('')
    setStaffId('')
    setServiceId('')
    setResourceId('')
    syncUrl({ search: '', status: '', staffId: '', serviceId: '', resourceId: '' })
  }

  function selectSlot(day: Date, hour = 9) {
    const start = new Date(day)
    start.setHours(hour, 0, 0, 0)
    const end = new Date(start)
    end.setMinutes(end.getMinutes() + 30)
    setSlot({ start: toDateTimeLocal(start.toISOString(), timezone), end: toDateTimeLocal(end.toISOString(), timezone) })
  }

  const customerRecords = customers.data?.content ?? []
  const staffRecords = staff.data?.content ?? []
  const serviceRecords = services.data?.content ?? []
  const resourceRecords = resources.data?.content ?? []
  const visibleAppointments = appointments.data?.content ?? []
  const calendarGridClass = view === 'day' ? 'grid-cols-1' : 'grid-cols-7'
  const calendarWidthClass = view === 'month' ? 'min-w-[900px]' : 'min-w-[700px]'
  const rangeStart = `${dateKey(days[0])}T00:00:00`
  const rangeEnd = `${dateKey(days[days.length - 1])}T23:59:59`
  const totalAppointments = appointments.data?.totalElements ?? 0
  const visibleAppointmentLimit = appointments.data?.content.length ?? 0
  const hasOverflow = totalAppointments > visibleAppointmentLimit

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-semibold text-indigo-600">Schedule</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Calendar</h2><p className="mt-2 text-sm text-slate-500">Calendar and list use the same appointment search rules.</p></div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#71809f] px-3 py-2 text-sm font-semibold text-[#0b1020]" type="button" onClick={() => { const next = new Date(); setAnchorDate(next); syncUrl({ date: next }) }}><FiTarget aria-hidden="true" />Today</button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => move(-1)}><FiChevronLeft aria-hidden="true" />Previous</button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => move(1)}>Next<FiChevronRight aria-hidden="true" /></button>
          {(['day', 'week', 'month', 'agenda'] as CalendarView[]).map((option) => <button className={`rounded-lg px-3 py-2 text-sm font-semibold ${view === option ? 'bg-indigo-600 text-white' : 'border border-slate-300 text-slate-700'}`} type="button" key={option} onClick={() => changeView(option)}>{option[0].toUpperCase() + option.slice(1)}</button>)}
        </div>
      </div>

      <FilterBar onClear={clearFilters}>
        <SearchInput value={search} placeholder="Search customer, email, service, staff, notes..." onChange={(value) => { setSearch(value); syncUrl({ search: value }) }} />
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={status} onChange={(event) => { setStatus(event.target.value); syncUrl({ status: event.target.value }) }}><option value="">All statuses</option><option value="PENDING">Pending</option><option value="CONFIRMED">Confirmed</option><option value="CHECKED_IN">Checked in</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option><option value="NO_SHOW">No-show</option></select>
        <AsyncCombobox value={staffId} selectedLabel={staffRecords.find((member) => member.id === staffId)?.name} placeholder="All staff" queryKey="calendar-staff" loadOptions={searchStaff} getOptionValue={(member) => member.id} getOptionLabel={(member) => member.name} onChange={(value) => { setStaffId(value); syncUrl({ staffId: value }) }} />
        <AsyncCombobox value={serviceId} selectedLabel={serviceRecords.find((service) => service.id === serviceId)?.name} placeholder="All services" queryKey="calendar-services" loadOptions={searchServices} getOptionValue={(service) => service.id} getOptionLabel={(service) => service.name} onChange={(value) => { setServiceId(value); syncUrl({ serviceId: value }) }} />
        <AsyncCombobox value={resourceId} selectedLabel={resourceRecords.find((resource) => resource.id === resourceId)?.name} placeholder="All resources" queryKey="calendar-resources" loadOptions={searchResources} getOptionValue={(resource) => resource.id} getOptionLabel={(resource) => resource.name} onChange={(value) => { setResourceId(value); syncUrl({ resourceId: value }) }} />
      </FilterBar>

      {hasOverflow ? <div className="mb-4 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><span>This range contains {totalAppointments} appointments. The calendar shows the first {visibleAppointmentLimit}; open the list to view all results.</span><Link className="font-semibold underline" to={`/appointments?from=${encodeURIComponent(rangeStart)}&to=${encodeURIComponent(rangeEnd)}${status ? `&status=${encodeURIComponent(status)}` : ''}`}>Open full list</Link></div> : null}

      <ListState loading={appointments.isLoading} error={appointments.isError} empty={false} loadingMessage="Loading calendar..." emptyMessage="No appointments match the current filters." onRetry={() => void appointments.refetch()}>
        {view === 'agenda' ? <div className="grid gap-3">
          {days.map((day) => {
            const key = dateKey(day)
            const dayAppointments = visibleAppointments.filter((appointment) => toDateTimeLocal(appointment.startTime, timezone).startsWith(key))
            return <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200" key={key}><div className="flex items-center justify-between border-b border-slate-100 pb-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{day.toLocaleDateString(undefined, { weekday: 'long' })}</p><p className="mt-1 text-lg font-bold text-slate-900">{day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p></div><button className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500" type="button" onClick={() => selectSlot(day)}>Add appointment</button></div><div className="mt-3 grid gap-2">{dayAppointments.map((appointment) => <button draggable className={`w-full rounded-xl border-l-4 p-3 text-left ${statusClass(appointment.status)}`} key={appointment.id} type="button" onClick={() => setSelected(appointment)} onDragStart={(event) => event.dataTransfer.setData('appointmentId', appointment.id)}><div className="flex items-start justify-between gap-3"><p className="text-xs font-bold">{formatAppointmentTime(appointment.startTime, timezone)} - {formatAppointmentTime(appointment.endTime, timezone)}</p><span className="text-[10px] font-bold uppercase tracking-wide">{appointment.status.replace('_', ' ')}</span></div><p className="mt-1 truncate text-sm font-semibold">{customerRecords.find((customer) => customer.id === appointment.customerId)?.name ?? 'Customer'}</p><p className="mt-1 truncate text-xs opacity-75">{serviceRecords.find((service) => service.id === appointment.serviceId)?.name ?? 'Service'}</p></button>)}{!dayAppointments.length ? <p className="py-3 text-sm text-slate-400">No appointments</p> : null}</div></section>
          })}
        </div> : <div className={`grid ${calendarWidthClass} ${calendarGridClass} gap-3 overflow-x-auto`}>
          {days.map((day) => {
            const key = dateKey(day)
            const dayAppointments = visibleAppointments.filter((appointment) => toDateTimeLocal(appointment.startTime, timezone).startsWith(key))
            return <section className={`${view === 'month' ? 'min-h-40' : 'min-h-96'} rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200`} key={key} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const id = event.dataTransfer.getData('appointmentId'); const appointment = visibleAppointments.find((item) => item.id === id); if (appointment) rescheduleMutation.mutate({ appointment, day }) }}>
              <button className="w-full border-b border-slate-100 pb-3 text-left" type="button" onClick={() => selectSlot(day)}><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p><p className="mt-1 text-xl font-bold text-slate-900">{day.getDate()}</p></button>
              <div className="mt-3 grid gap-2">
                {dayAppointments.map((appointment) => <button draggable className={`w-full rounded-xl border-l-4 p-3 text-left ${statusClass(appointment.status)}`} key={appointment.id} type="button" onClick={() => setSelected(appointment)} onDragStart={(event) => event.dataTransfer.setData('appointmentId', appointment.id)}><p className="text-xs font-bold">{formatAppointmentTime(appointment.startTime, timezone)}</p><p className="mt-1 truncate text-sm font-semibold">{customerRecords.find((customer) => customer.id === appointment.customerId)?.name ?? 'Customer'}</p><p className="mt-1 truncate text-xs opacity-75">{serviceRecords.find((service) => service.id === appointment.serviceId)?.name ?? 'Service'}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-wide">{appointment.status.replace('_', ' ')}</p></button>)}
                {view !== 'month' ? <button data-tour="calendar-create" className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-2 py-3 text-xs font-semibold text-slate-400 hover:border-indigo-400 hover:text-indigo-600" type="button" onClick={() => selectSlot(day)}><FiPlus aria-hidden="true" />Create at 9:00 AM</button> : null}
                {!dayAppointments.length && view === 'month' ? <p className="py-4 text-center text-xs text-slate-400">No bookings</p> : null}
              </div>
            </section>
          })}
        </div>}
      </ListState>

      {slot ? <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-5" role="dialog" aria-modal="true" aria-labelledby="calendar-create-title"><form className="grid w-full max-w-md gap-4 rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); createMutation.mutate() }}><div><p className="text-sm font-semibold text-indigo-600">New appointment</p><h3 id="calendar-create-title" className="mt-1 text-xl font-bold text-slate-900">{slot.start.replace('T', ' ')}</h3></div><AsyncCombobox value={createForm.customerId} selectedLabel={customerRecords.find((customer) => customer.id === createForm.customerId)?.name} placeholder="Search customers..." queryKey="calendar-customers" loadOptions={searchCustomers} getOptionValue={(customer) => customer.id} getOptionLabel={(customer) => `${customer.name} · ${customer.email}`} onChange={(value) => setCreateForm({ ...createForm, customerId: value })} required /><AsyncCombobox value={createForm.staffId} selectedLabel={staffRecords.find((member) => member.id === createForm.staffId)?.name} placeholder="Search staff..." queryKey="calendar-create-staff" loadOptions={searchStaff} getOptionValue={(member) => member.id} getOptionLabel={(member) => member.name} onChange={(value) => setCreateForm({ ...createForm, staffId: value })} required /><AsyncCombobox value={createForm.serviceId} selectedLabel={serviceRecords.find((service) => service.id === createForm.serviceId)?.name} placeholder="Search services..." queryKey="calendar-create-services" loadOptions={searchServices} getOptionValue={(service) => service.id} getOptionLabel={(service) => service.name} onChange={(value) => setCreateForm({ ...createForm, serviceId: value })} required /><AsyncCombobox value={createForm.resourceId} selectedLabel={resourceRecords.find((resource) => resource.id === createForm.resourceId)?.name} placeholder="Search resources (optional)..." queryKey="calendar-create-resources" loadOptions={searchResources} getOptionValue={(resource) => resource.id} getOptionLabel={(resource) => resource.name} onChange={(value) => setCreateForm({ ...createForm, resourceId: value })} /><textarea className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Notes" value={createForm.notes} onChange={(event) => setCreateForm({ ...createForm, notes: event.target.value })} /><div className="flex gap-2"><button className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white" type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating...' : 'Create appointment'}</button><button className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold" type="button" onClick={() => setSlot(null)}>Close</button></div></form></div> : null}

      {selected ? <div className="fixed inset-0 z-30 bg-slate-950/40" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}><aside className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="calendar-details-title"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-indigo-600">Appointment details</p><h3 id="calendar-details-title" className="mt-1 text-2xl font-bold text-slate-900">{customerRecords.find((customer) => customer.id === selected.customerId)?.name ?? 'Customer'}</h3></div><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" type="button" onClick={() => setSelected(null)}>Close</button></div><dl className="mt-6 grid gap-4 text-sm"><div><dt className="font-semibold text-slate-500">When</dt><dd className="mt-1 text-slate-900">{formatAppointmentDateTime(selected.startTime, timezone)} - {formatAppointmentTime(selected.endTime, timezone)}</dd></div><div><dt className="font-semibold text-slate-500">Status</dt><dd className="mt-1 text-slate-900">{selected.status.replace('_', ' ')}</dd></div><div><dt className="font-semibold text-slate-500">Service</dt><dd className="mt-1 text-slate-900">{serviceRecords.find((service) => service.id === selected.serviceId)?.name ?? 'Service'}</dd></div><div><dt className="font-semibold text-slate-500">Staff</dt><dd className="mt-1 text-slate-900">{staffRecords.find((member) => member.id === selected.staffId)?.name ?? 'Staff'}</dd></div><div><dt className="font-semibold text-slate-500">Notes</dt><dd className="mt-1 whitespace-pre-wrap text-slate-900">{selected.notes || 'No notes'}</dd></div></dl></aside></div> : null}
    </div>
  )
}
