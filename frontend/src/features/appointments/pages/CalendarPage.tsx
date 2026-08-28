import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAppointments } from '../appointmentsApi'
import { fetchCustomers } from '../../customers/customersApi'
import { fetchStaff } from '../../staff/staffApi'
import { fetchServices } from '../../services/servicesApi'

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
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

export function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => {
    return startOfWeek(new Date())
  })
  const appointments = useQuery({ queryKey: ['appointments'], queryFn: () => fetchAppointments() })
  const customers = useQuery({ queryKey: ['customers'], queryFn: () => fetchCustomers() })
  const staff = useQuery({ queryKey: ['staff'], queryFn: fetchStaff })
  const services = useQuery({ queryKey: ['services'], queryFn: fetchServices })
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + index)
    return day
  }), [weekStart])
  const moveWeek = (offset: number) => {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + offset * 7)
    setWeekStart(next)
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-indigo-600">Schedule</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Calendar</h2><p className="mt-2 text-sm text-slate-500">Choose a week to view all 7 days at once.</p></div><div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="calendar-week">Week</label><input id="calendar-week" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold" type="week" value={weekInputValue(weekStart)} onChange={(event) => { const next = weekStartFromInput(event.target.value); if (next) setWeekStart(next) }} /><button className="rounded-lg bg-[#71809f] px-3 py-2 text-sm font-semibold text-[#0b1020] hover:bg-[#8492ad]" type="button" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</button><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => moveWeek(-1)}>Previous week</button><button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700" type="button" onClick={() => moveWeek(1)}>Next week</button></div></div>
      <div className="grid min-w-[900px] grid-cols-7 gap-3 overflow-x-auto">{days.map((day) => { const key = dateKey(day); const dayAppointments = appointments.data?.filter((appointment) => appointment.startTime?.startsWith(key) && appointment.status !== 'CANCELLED') ?? []; return <section className="min-h-96 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200" key={key}><header className="border-b border-slate-100 pb-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{day.toLocaleDateString(undefined, { weekday: 'short' })}</p><p className="mt-1 text-xl font-bold text-slate-900">{day.getDate()}</p></header><div className="mt-3 grid gap-2">{dayAppointments.length ? dayAppointments.map((appointment) => <div className="rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-3" key={appointment.id}><p className="text-xs font-bold text-indigo-700">{new Date(appointment.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p><p className="mt-1 truncate text-sm font-semibold text-slate-800">{customers.data?.find((customer) => customer.id === appointment.customerId)?.name ?? 'Customer'}</p><p className="mt-1 truncate text-xs text-slate-500">{services.data?.find((service) => service.id === appointment.serviceId)?.name ?? 'Service'}</p><p className="mt-1 truncate text-xs text-slate-500">{staff.data?.find((member) => member.id === appointment.staffId)?.name ?? 'Staff'}</p></div>) : <p className="py-6 text-center text-xs text-slate-400">No bookings</p>}</div></section> })}</div>
    </div>
  )
}
