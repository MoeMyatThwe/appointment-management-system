import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addHoliday, fetchBusinessHours, fetchHolidays, saveBusinessHours } from '../scheduleApi'
import type { BusinessHours } from '../types'

function formatDay(dayName: string) {
  return dayName.charAt(0) + dayName.slice(1).toLowerCase()
}

export function SchedulePage() {
  const queryClient = useQueryClient()
  const hoursQuery = useQuery({ queryKey: ['business-hours'], queryFn: fetchBusinessHours })
  const holidaysQuery = useQuery({ queryKey: ['holidays'], queryFn: fetchHolidays })
  const [hours, setHours] = useState<BusinessHours[]>([])
  const [holidayName, setHolidayName] = useState('')
  const [holidayDate, setHolidayDate] = useState('')

  useEffect(() => {
    if (hoursQuery.data) setHours(hoursQuery.data)
  }, [hoursQuery.data])

  const saveMutation = useMutation({
    mutationFn: saveBusinessHours,
    onSuccess: (saved) => {
      setHours(saved)
      void queryClient.invalidateQueries({ queryKey: ['business-hours'] })
    },
  })
  const holidayMutation = useMutation({
    mutationFn: addHoliday,
    onSuccess: () => {
      setHolidayName('')
      setHolidayDate('')
      void queryClient.invalidateQueries({ queryKey: ['holidays'] })
    },
  })

  function updateDay(dayOfWeek: number, changes: Partial<BusinessHours>) {
    setHours((current) => current.map((day) => day.dayOfWeek === dayOfWeek ? { ...day, ...changes } : day))
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8"><p className="text-sm font-semibold text-indigo-600">Availability</p><h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Business hours</h2><p className="mt-2 text-sm text-slate-500">Set when customers can book appointments. Breaks and holidays block availability automatically.</p></div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-lg font-semibold text-slate-900">Weekly schedule</h3><p className="mt-1 text-sm text-slate-500">Use your local business time.</p></div><button className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700" type="button" onClick={() => saveMutation.mutate(hours)} disabled={saveMutation.isPending || hours.length !== 7}>{saveMutation.isPending ? 'Saving...' : 'Save schedule'}</button></div>
          <div className="mt-5 grid gap-3">{hours.map((day) => <div className="rounded-xl bg-slate-50 p-4" key={day.dayOfWeek}><div className="flex flex-wrap items-center gap-4"><label className="flex min-w-32 items-center gap-3 font-semibold text-slate-800"><input type="checkbox" checked={day.enabled} onChange={(event) => updateDay(day.dayOfWeek, { enabled: event.target.checked })} />{formatDay(day.dayName)}</label>{day.enabled ? <><input className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" type="time" value={day.openTime ?? ''} onChange={(event) => updateDay(day.dayOfWeek, { openTime: event.target.value })} /><span className="text-slate-400">to</span><input className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" type="time" value={day.closeTime ?? ''} onChange={(event) => updateDay(day.dayOfWeek, { closeTime: event.target.value })} /></> : <span className="text-sm text-slate-500">Closed</span>}</div>{day.enabled ? <div className="mt-3 flex flex-wrap items-center gap-3 pl-8 text-sm text-slate-500"><span>Break</span><input className="rounded-lg border border-slate-300 bg-white px-3 py-2" type="time" value={day.breakStart ?? ''} onChange={(event) => updateDay(day.dayOfWeek, { breakStart: event.target.value || null })} /><span>to</span><input className="rounded-lg border border-slate-300 bg-white px-3 py-2" type="time" value={day.breakEnd ?? ''} onChange={(event) => updateDay(day.dayOfWeek, { breakEnd: event.target.value || null })} /><button className="text-xs font-semibold text-slate-500 hover:text-slate-800" type="button" onClick={() => updateDay(day.dayOfWeek, { breakStart: null, breakEnd: null })}>Clear break</button></div> : null}</div>)}</div>
        </section>
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><h3 className="text-lg font-semibold text-slate-900">Holidays and closures</h3><p className="mt-1 text-sm text-slate-500">Appointments cannot be created on these dates.</p><form className="mt-5 grid gap-3" onSubmit={(event) => { event.preventDefault(); holidayMutation.mutate({ name: holidayName, holidayDate }) }}><input className="rounded-lg border border-slate-300 px-3 py-2.5" type="date" value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} required /><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Closure name" value={holidayName} onChange={(event) => setHolidayName(event.target.value)} required /><button className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-100" type="submit" disabled={holidayMutation.isPending}>Add closure</button></form><div className="mt-5 grid gap-2">{holidaysQuery.data?.length ? holidaysQuery.data.map((holiday) => <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-3 text-sm" key={holiday.id}><span className="font-medium text-slate-800">{holiday.name}</span><span className="text-slate-500">{holiday.holidayDate}</span></div>) : <p className="mt-4 text-sm text-slate-500">No closures added yet.</p>}</div></section>
      </div>
    </div>
  )
}
