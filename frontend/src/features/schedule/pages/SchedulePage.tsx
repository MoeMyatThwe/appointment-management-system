import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addHoliday, fetchBusinessHours, fetchHolidays, saveBusinessHours } from '../scheduleApi'
import type { BusinessHours } from '../types'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'
import { FiCheck, FiCopy, FiPlus, FiSave, FiZap, FiX } from 'react-icons/fi'

function formatDay(dayName: string) {
  return dayName.charAt(0) + dayName.slice(1).toLowerCase()
}

function timeValue(value: string | null | undefined, fallback: string) {
  return value || fallback
}

export function SchedulePage() {
  const queryClient = useQueryClient()
  const hoursQuery = useQuery({ queryKey: ['business-hours'], queryFn: fetchBusinessHours })
  const holidaysQuery = useQuery({ queryKey: ['holidays'], queryFn: fetchHolidays })
  const [hours, setHours] = useState<BusinessHours[]>([])
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [bulkOpenTime, setBulkOpenTime] = useState('09:00')
  const [bulkCloseTime, setBulkCloseTime] = useState('17:00')
  const [bulkHasBreak, setBulkHasBreak] = useState(false)
  const [bulkBreakStart, setBulkBreakStart] = useState('12:00')
  const [bulkBreakEnd, setBulkBreakEnd] = useState('13:00')
  const [holidayName, setHolidayName] = useState('')
  const [holidayDate, setHolidayDate] = useState('')
  const [showHolidayForm, setShowHolidayForm] = useState(false)
  useEscapeKey(showHolidayForm, () => setShowHolidayForm(false))

  const weekdayIds = useMemo(
    () => hours.filter((day) => ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day.dayName.toUpperCase())).map((day) => day.dayOfWeek),
    [hours],
  )

  useEffect(() => {
    if (!hoursQuery.data) return
    setHours(hoursQuery.data)
    const weekdays = hoursQuery.data.filter((day) => ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day.dayName.toUpperCase()))
    const firstConfigured = weekdays.find((day) => day.enabled) ?? weekdays[0]
    setSelectedDays(weekdays.map((day) => day.dayOfWeek))
    if (firstConfigured) {
      setBulkOpenTime(timeValue(firstConfigured.openTime, '09:00'))
      setBulkCloseTime(timeValue(firstConfigured.closeTime, '17:00'))
      setBulkHasBreak(Boolean(firstConfigured.breakStart && firstConfigured.breakEnd))
      setBulkBreakStart(timeValue(firstConfigured.breakStart, '12:00'))
      setBulkBreakEnd(timeValue(firstConfigured.breakEnd, '13:00'))
    }
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
      setShowHolidayForm(false)
      void queryClient.invalidateQueries({ queryKey: ['holidays'] })
    },
  })

  function updateDay(dayOfWeek: number, changes: Partial<BusinessHours>) {
    setHours((current) => current.map((day) => day.dayOfWeek === dayOfWeek ? { ...day, ...changes } : day))
  }

  function toggleSelectedDay(dayOfWeek: number) {
    setSelectedDays((current) => current.includes(dayOfWeek) ? current.filter((day) => day !== dayOfWeek) : [...current, dayOfWeek])
  }

  function choosePreset(days: number[]) {
    setSelectedDays(days)
    const source = hours.find((day) => days.includes(day.dayOfWeek) && day.enabled) ?? hours.find((day) => days.includes(day.dayOfWeek))
    if (!source) return
    setBulkOpenTime(timeValue(source.openTime, '09:00'))
    setBulkCloseTime(timeValue(source.closeTime, '17:00'))
    setBulkHasBreak(Boolean(source.breakStart && source.breakEnd))
    setBulkBreakStart(timeValue(source.breakStart, '12:00'))
    setBulkBreakEnd(timeValue(source.breakEnd, '13:00'))
  }

  function applyBulkSchedule() {
    const breakValues = bulkHasBreak ? { breakStart: bulkBreakStart || null, breakEnd: bulkBreakEnd || null } : { breakStart: null, breakEnd: null }
    setHours((current) => current.map((day) => selectedDays.includes(day.dayOfWeek)
      ? { ...day, enabled: true, openTime: bulkOpenTime, closeTime: bulkCloseTime, ...breakValues }
      : day))
  }

  function copyMondayToWeekdays() {
    const monday = hours.find((day) => day.dayName.toUpperCase() === 'MONDAY')
    if (!monday) return
    setSelectedDays(weekdayIds)
    setBulkOpenTime(timeValue(monday.openTime, '09:00'))
    setBulkCloseTime(timeValue(monday.closeTime, '17:00'))
    setBulkHasBreak(Boolean(monday.breakStart && monday.breakEnd))
    setBulkBreakStart(timeValue(monday.breakStart, '12:00'))
    setBulkBreakEnd(timeValue(monday.breakEnd, '13:00'))
    setHours((current) => current.map((day) => weekdayIds.includes(day.dayOfWeek)
      ? { ...day, enabled: true, openTime: timeValue(monday.openTime, '09:00'), closeTime: timeValue(monday.closeTime, '17:00'), breakStart: monday.breakStart, breakEnd: monday.breakEnd }
      : day))
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="text-sm font-semibold text-indigo-600">Availability</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Business hours</h2>
        <p className="mt-2 text-sm text-slate-500">Set when customers can book appointments. Apply common hours in one step, then customize individual days when needed.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section data-tour="schedule-form" className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h3 className="text-lg font-semibold text-slate-900">Weekly schedule</h3><p className="mt-1 text-sm text-slate-500">Use your local business time.</p></div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700" type="button" onClick={() => saveMutation.mutate(hours)} disabled={saveMutation.isPending || hours.length !== 7}><FiSave aria-hidden="true" />{saveMutation.isPending ? 'Saving...' : 'Save schedule'}</button>
          </div>

          <div className="mt-6 rounded-2xl border border-indigo-200/60 bg-indigo-50/50 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div><div className="flex items-center gap-2"><FiZap className="text-indigo-600" aria-hidden="true" /><h4 className="font-semibold text-slate-900">Quick apply</h4></div><p className="mt-1 text-sm text-slate-600">Set the same hours for several days at once.</p></div>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100" type="button" onClick={() => choosePreset(weekdayIds)}>Weekdays</button>
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100" type="button" onClick={copyMondayToWeekdays}><FiCopy aria-hidden="true" />Copy Monday to weekdays</button>
              </div>
            </div>
            <div className="mt-4 grid gap-4">
              <div className="flex flex-wrap gap-2">
                {hours.map((day) => <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${selectedDays.includes(day.dayOfWeek) ? 'border-indigo-400 bg-indigo-100 text-indigo-800' : 'border-slate-300 bg-white text-slate-600'}`} key={day.dayOfWeek}><input className="sr-only" type="checkbox" checked={selectedDays.includes(day.dayOfWeek)} onChange={() => toggleSelectedDay(day.dayOfWeek)} /><span className={`flex h-4 w-4 items-center justify-center rounded border ${selectedDays.includes(day.dayOfWeek) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'}`}>{selectedDays.includes(day.dayOfWeek) ? <FiCheck size={11} aria-hidden="true" /> : null}</span>{formatDay(day.dayName).slice(0, 3)}</label>)}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="grid gap-1 text-xs font-semibold text-slate-600">Opens<input className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" type="time" value={bulkOpenTime} onChange={(event) => setBulkOpenTime(event.target.value)} /></label>
                <label className="grid gap-1 text-xs font-semibold text-slate-600">Closes<input className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" type="time" value={bulkCloseTime} onChange={(event) => setBulkCloseTime(event.target.value)} /></label>
                <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={bulkHasBreak} onChange={(event) => setBulkHasBreak(event.target.checked)} />Add break</label>
                <button className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={applyBulkSchedule} disabled={!selectedDays.length}><FiCheck aria-hidden="true" />Apply to {selectedDays.length || 'selected'} days</button>
              </div>
              {bulkHasBreak ? <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-semibold text-slate-600">Break starts<input className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" type="time" value={bulkBreakStart} onChange={(event) => setBulkBreakStart(event.target.value)} /></label><label className="grid gap-1 text-xs font-semibold text-slate-600">Break ends<input className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm" type="time" value={bulkBreakEnd} onChange={(event) => setBulkBreakEnd(event.target.value)} /></label></div> : null}
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {hours.map((day) => <div className="rounded-xl bg-slate-50 p-4" key={day.dayOfWeek}>
              <div className="grid gap-3 lg:grid-cols-[minmax(150px,0.7fr)_1fr] lg:items-center">
                <label className="flex items-center gap-3 font-semibold text-slate-800"><input type="checkbox" checked={day.enabled} onChange={(event) => updateDay(day.dayOfWeek, { enabled: event.target.checked })} />{formatDay(day.dayName)}</label>
                {day.enabled ? <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><input aria-label={`${formatDay(day.dayName)} opens`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" type="time" value={day.openTime ?? ''} onChange={(event) => updateDay(day.dayOfWeek, { openTime: event.target.value })} /><span className="hidden text-center text-slate-400 sm:block">to</span><input aria-label={`${formatDay(day.dayName)} closes`} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" type="time" value={day.closeTime ?? ''} onChange={(event) => updateDay(day.dayOfWeek, { closeTime: event.target.value })} /></div> : <span className="text-sm text-slate-500">Closed</span>}
              </div>
              {day.enabled ? <div className="mt-3 grid gap-2 pl-0 text-sm text-slate-500 sm:grid-cols-[minmax(150px,0.7fr)_1fr]"><span className="font-medium">Break (optional)</span><div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center"><input aria-label={`${formatDay(day.dayName)} break starts`} className="rounded-lg border border-slate-300 bg-white px-3 py-2" type="time" value={day.breakStart ?? ''} onChange={(event) => updateDay(day.dayOfWeek, { breakStart: event.target.value || null })} /><span className="hidden text-center text-slate-400 sm:block">to</span><input aria-label={`${formatDay(day.dayName)} break ends`} className="rounded-lg border border-slate-300 bg-white px-3 py-2" type="time" value={day.breakEnd ?? ''} onChange={(event) => updateDay(day.dayOfWeek, { breakEnd: event.target.value || null })} /><button className="text-left text-xs font-semibold text-slate-500 hover:text-slate-800" type="button" onClick={() => updateDay(day.dayOfWeek, { breakStart: null, breakEnd: null })}>Clear break</button></div></div> : null}
            </div>)}
          </div>
        </section>
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-slate-900">Holidays and closures</h3><p className="mt-1 text-sm text-slate-500">Appointments cannot be created on these dates.</p></div><button className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100" type="button" onClick={() => setShowHolidayForm(true)}><FiPlus aria-hidden="true" />Add closure</button></div>
          <div className="mt-5 grid gap-2">{holidaysQuery.data?.length ? holidaysQuery.data.map((holiday) => <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-3 text-sm" key={holiday.id}><span className="font-medium text-slate-800">{holiday.name}</span><span className="text-slate-500">{holiday.holidayDate}</span></div>) : <p className="mt-4 text-sm text-slate-500">No closures added yet.</p>}</div>
        </section>
      </div>
      {showHolidayForm ? <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowHolidayForm(false) }}><form className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onSubmit={(event) => { event.preventDefault(); holidayMutation.mutate({ name: holidayName, holidayDate }) }} role="dialog" aria-modal="true" aria-labelledby="add-closure-title"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-indigo-600">Availability</p><h3 id="add-closure-title" className="mt-1 text-xl font-bold text-slate-900">Add closure</h3></div><button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button" aria-label="Close add closure dialog" onClick={() => setShowHolidayForm(false)}><FiX aria-hidden="true" /></button></div><div className="mt-5 grid gap-3"><input className="rounded-lg border border-slate-300 px-3 py-2.5" type="date" value={holidayDate} onChange={(event) => setHolidayDate(event.target.value)} required autoFocus /><input className="rounded-lg border border-slate-300 px-3 py-2.5" placeholder="Closure name" value={holidayName} onChange={(event) => setHolidayName(event.target.value)} required /><div className="flex justify-end gap-2"><button className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700" type="button" onClick={() => setShowHolidayForm(false)}>Cancel</button><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white" type="submit" disabled={holidayMutation.isPending}><FiPlus aria-hidden="true" />{holidayMutation.isPending ? 'Saving...' : 'Add closure'}</button></div></div></form></div> : null}
    </div>
  )
}
