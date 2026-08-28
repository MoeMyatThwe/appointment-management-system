import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FilterBar } from '../../../shared/components/FilterBar'
import { ListState } from '../../../shared/components/ListState'
import { SearchInput } from '../../../shared/components/SearchInput'
import { searchAppointments } from '../appointmentsApi'
import { fetchCustomers } from '../../customers/customersApi'
import { fetchStaff } from '../../staff/staffApi'
import { fetchServices } from '../../services/servicesApi'
import { fetchResources } from '../../resources/resourcesApi'

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfWeek(date: Date) {
  const start = new Date(date)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  start.setHours(0, 0, 0, 0)
  return start
}

function weekInputValue(date: Date) {
  const thursday = new Date(date)
  thursday.setDate(thursday.getDate() + (4 - (thursday.getDay() || 7)))
  const yearStart = new Date(thursday.getFullYear(), 0, 1)
  const week = Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${thursday.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function weekStartFromInput(value: string) {
  const match = /^(\d{4})-W(\d{2})$/.exec(value)
  if (!match) {
    return null
  }
  const firstWeek = startOfWeek(new Date(Number(match[1]), 0, 4))
  firstWeek.setDate(firstWeek.getDate() + (Number(match[2]) - 1) * 7)
  return firstWeek
}

function appointmentStatusClass(status: string) {
  if (status === 'CANCELLED') return 'border-rose-500 bg-rose-50 text-rose-800'
  if (status === 'COMPLETED') return 'border-emerald-500 bg-emerald-50 text-emerald-800'
  if (status === 'NO_SHOW') return 'border-amber-500 bg-amber-50 text-amber-800'
  return 'border-indigo-500 bg-indigo-50 text-indigo-800'
}

export function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [staffFilter, setStaffFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + index)
    return day
  }), [weekStart])

  const appointments = useQuery({
    queryKey: ['appointments', 'calendar', weekStart, search, statusFilter, staffFilter, serviceFilter, resourceFilter],
    queryFn: () => searchAppointments({
      search,
      status: statusFilter,
      staffId: staffFilter,
      serviceId: serviceFilter,
      resourceId: resourceFilter,
      from: `${dateKey(days[0])}T00:00:00`,
      to: `${dateKey(days[6])}T23:59:59`,
      page: 0,
      size: 100,
      sortBy: 'startTime',
      direction: 'asc',
    }),
  })
  const customers = useQuery({ queryKey: ['customers'], queryFn: () => fetchCustomers() })
  const staff = useQuery({ queryKey: ['staff'], queryFn: fetchStaff })
  const services = useQuery({ queryKey: ['services'], queryFn: fetchServices })
  const resources = useQuery({ queryKey: ['resources'], queryFn: fetchResources })
  const visibleAppointments = appointments.data?.content ?? []

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setStaffFilter('')
    setServiceFilter('')
    setResourceFilter('')
  }

  function moveWeek(offset: number) {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + offset * 7)
    setWeekStart(next)
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Schedule</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Calendar</h2>
          <p className="mt-2 text-sm text-slate-500">View the same filtered appointments as the list view.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="calendar-week">Week</label>
          <input id="calendar-week" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" type="week" value={weekInputValue(weekStart)} onChange={(event) => { const next = weekStartFromInput(event.target.value); if (next) setWeekStart(next) }} />
          <button className="rounded-lg bg-[#71809f] px-3 py-2 text-sm font-semibold text-[#0b1020] hover:bg-[#8492ad]" type="button" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</button>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => moveWeek(-1)}>Previous week</button>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => moveWeek(1)}>Next week</button>
        </div>
      </div>

      <FilterBar onClear={clearFilters}>
        <SearchInput value={search} placeholder="Search customer, email, service, staff, notes..." onChange={setSearch} />
        <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No-show</option>
        </select>
        <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={staffFilter} onChange={(event) => setStaffFilter(event.target.value)}>
          <option value="">All staff</option>
          {staff.data?.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
        <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
          <option value="">All services</option>
          {services.data?.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
        </select>
        <select className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)}>
          <option value="">All resources</option>
          {resources.data?.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
        </select>
      </FilterBar>

      <ListState
        loading={appointments.isLoading}
        error={appointments.isError}
        empty={false}
        loadingMessage="Loading calendar..."
        emptyMessage="No appointments match the current week and filters."
      >
        <div className="grid min-w-[900px] grid-cols-7 gap-3 overflow-x-auto">
          {days.map((day) => {
            const key = dateKey(day)
            const dayAppointments = visibleAppointments.filter((appointment) =>
              appointment.startTime?.startsWith(key))
            return (
              <section className="min-h-96 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200" key={key}>
                <header className="border-b border-slate-100 pb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {day.toLocaleDateString(undefined, { weekday: 'short' })}
                  </p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{day.getDate()}</p>
                </header>
                <div className="mt-3 grid gap-2">
                  {dayAppointments.length ? dayAppointments.map((appointment) => (
                    <div className={`rounded-xl border-l-4 p-3 ${appointmentStatusClass(appointment.status)}`} key={appointment.id}>
                      <p className="text-xs font-bold">
                        {new Date(appointment.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold">
                        {customers.data?.find((customer) => customer.id === appointment.customerId)?.name ?? 'Customer'}
                      </p>
                      <p className="mt-1 truncate text-xs opacity-75">
                        {services.data?.find((service) => service.id === appointment.serviceId)?.name ?? 'Service'}
                      </p>
                      <p className="mt-1 truncate text-xs opacity-75">
                        {staff.data?.find((member) => member.id === appointment.staffId)?.name ?? 'Staff'}
                      </p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wide">{appointment.status.replace('_', ' ')}</p>
                    </div>
                  )) : <p className="py-6 text-center text-xs text-slate-400">No bookings</p>}
                </div>
              </section>
            )
          })}
        </div>
      </ListState>
    </div>
  )
}
