import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiCheck, FiClock, FiHome, FiMapPin } from 'react-icons/fi'
import { fetchPublicAvailableDates, fetchPublicCatalog, fetchPublicSlots, submitPublicBooking } from '../publicBookingApi'
import { useAuthStore } from '../../auth/authStore'

function localDate(timezone: string, daysFromNow = 1) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toLocaleDateString('en-CA', { timeZone: timezone })
}

function monthFor(date: string) {
  return date.slice(0, 7)
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}-01T12:00:00Z`))
}

function formatCalendarDay(value: string) {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T12:00:00Z`))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
}

function formatTime(value: string, timezone: string) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: timezone }).format(new Date(value))
}

export function PublicBookingPage() {
  const user = useAuthStore((state) => state.user)
  const { tenantId = '' } = useParams()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [date, setDate] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [monthCursor, setMonthCursor] = useState(() => new Date().toISOString().slice(0, 7))
  const [slot, setSlot] = useState<{ startTime: string; endTime: string } | null>(null)
  const [consent, setConsent] = useState(false)
  const [idempotencyKey] = useState(() => crypto.randomUUID())
  const [customer, setCustomer] = useState({ customerName: '', customerEmail: '', customerPhone: '', notes: '' })
  const catalogQuery = useQuery({
    queryKey: ['public-catalog', tenantId],
    queryFn: () => fetchPublicCatalog(tenantId),
    enabled: Boolean(tenantId),
  })
  const businessTimezone = catalogQuery.data?.timezone || 'UTC'
  const availabilityFrom = localDate(businessTimezone, 0)
  const availabilityTo = localDate(businessTimezone, 60)
  const selectedDate = date
  const availabilityQuery = useQuery({
    queryKey: ['public-available-dates', tenantId, availabilityFrom, availabilityTo, serviceId, staffId, businessTimezone],
    queryFn: () => fetchPublicAvailableDates(
      tenantId, availabilityFrom, availabilityTo, serviceId, staffId, businessTimezone,
    ),
    enabled: Boolean(tenantId && serviceId && staffId && step === 1),
  })
  const slotsQuery = useQuery({
    queryKey: ['public-slots', tenantId, selectedDate, serviceId, staffId, businessTimezone],
    queryFn: () => fetchPublicSlots(tenantId, selectedDate, serviceId, staffId, businessTimezone),
    enabled: Boolean(tenantId && selectedDate && serviceId && staffId && step >= 2),
  })
  const bookingMutation = useMutation({
    mutationFn: () => submitPublicBooking(tenantId, { serviceId, staffId, ...slot!, ...customer }, idempotencyKey),
    onSuccess: () => setSlot(null),
  })
  const service = catalogQuery.data?.services.find((item) => item.id === serviceId)
  const staffMember = catalogQuery.data?.staff.find((item) => item.id === staffId)
  const businessName = catalogQuery.data?.businessName && catalogQuery.data.businessName !== tenantId
    ? catalogQuery.data.businessName
    : 'Book an appointment'
  const availableDates = useMemo(() => new Set(availabilityQuery.data ?? []), [availabilityQuery.data])
  const calendarDays = useMemo(() => {
    const first = new Date(`${monthCursor}-01T12:00:00Z`)
    const firstVisible = new Date(first)
    firstVisible.setUTCDate(1 - first.getUTCDay())
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(firstVisible)
      day.setUTCDate(firstVisible.getUTCDate() + index)
      return day.toISOString().slice(0, 10)
    })
  }, [monthCursor])
  const canContinueToTimes = Boolean(serviceId && staffId && selectedDate)
  const canSubmit = Boolean(slot && consent && customer.customerName.trim() && customer.customerEmail.trim())
  const summary = useMemo(() => service && staffMember && slot ? {
    service: service.name,
    staff: staffMember.name,
    date: formatDate(selectedDate),
    time: `${formatTime(slot.startTime, businessTimezone)} - ${formatTime(slot.endTime, businessTimezone)}`,
  } : null, [businessTimezone, selectedDate, service, staffMember, slot])

  const goBack = () => {
    if (step > 1) {
      setStep((current) => current - 1)
      return
    }
    if (window.history.length > 1) navigate(-1)
    else {
      const referrer = document.referrer
      if (referrer) {
        const previousUrl = new URL(referrer)
        if (previousUrl.origin === window.location.origin && previousUrl.pathname !== window.location.pathname) {
          navigate(`${previousUrl.pathname}${previousUrl.search}${previousUrl.hash}`)
          return
        }
      }
      navigate('/')
    }
  }

  const selectService = (value: string) => {
    setServiceId(value)
    setDate('')
    setMonthCursor(monthFor(availabilityFrom))
    setSlot(null)
  }

  const selectStaff = (value: string) => {
    setStaffId(value)
    setDate('')
    setMonthCursor(monthFor(availabilityFrom))
    setSlot(null)
  }

  const selectDate = (value: string) => {
    if (!availableDates.has(value)) return
    setDate(value)
    setSlot(null)
  }

  if (bookingMutation.isSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#18234a] px-5 py-10">
        <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700"><FiCheck aria-hidden="true" /></div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Request received</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Your appointment is pending confirmation</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">We will contact you at {customer.customerEmail} with the next steps.</p>
          {summary ? <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left text-sm"><p className="font-semibold text-slate-900">{summary.service}</p><p className="mt-1 text-slate-600">{summary.date} · {summary.time}</p><p className="mt-1 text-slate-600">With {summary.staff}</p></div> : null}
          {bookingMutation.data?.publicManageToken ? <a className="mt-4 block rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700" href={`/book/${tenantId}/manage/${bookingMutation.data.publicManageToken}`}>Manage, reschedule, or cancel this appointment</a> : null}
          <div className="mt-6 flex justify-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700" type="button" onClick={goBack}><FiArrowLeft aria-hidden="true" />Back</button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-[#18234a] px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={() => navigate('/')}><FiHome aria-hidden="true" />Home</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#18234a] px-5 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 flex items-center justify-between text-sm text-slate-300" aria-label="Booking navigation">
          <button className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 hover:text-white" type="button" onClick={goBack}><FiArrowLeft aria-hidden="true" />{step > 1 ? 'Previous' : 'Back'}</button>
          <button className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 hover:text-white" type="button" onClick={() => navigate('/')}><FiHome aria-hidden="true" />Home</button>
        </nav>

        <header className="mb-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b6c0d4]">Online booking</p>
          <h1 className="mt-3 text-4xl font-bold">{businessName}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Choose a service, a preferred team member, and a time. We will confirm the appointment with you.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-8 grid grid-cols-3 gap-2" aria-label="Booking progress">
              {['Choose service', 'Select time', 'Your details'].map((label, index) => {
                const number = index + 1
                return <div className={`border-t-2 pt-3 text-xs font-semibold ${step >= number ? 'border-indigo-300 text-white' : 'border-slate-500/70 text-slate-400'}`} key={label}><span>{number}. </span>{label}</div>
              })}
            </div>

            {catalogQuery.isLoading ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Loading services and availability...</p> : catalogQuery.isError ? <div className="rounded-2xl bg-rose-50 p-5 text-sm text-rose-700"><p className="font-semibold">This booking page is unavailable.</p><p className="mt-1">The business may have paused online booking. Please try again later.</p><button className="mt-4 rounded-lg border border-rose-200 px-3 py-2 font-semibold" type="button" onClick={() => void catalogQuery.refetch()}>Try again</button></div> : !catalogQuery.data?.services.length || !catalogQuery.data.staff.length ? <div className="rounded-2xl bg-amber-50 p-5 text-sm text-amber-800"><p className="font-semibold">Online booking is not ready yet.</p><p className="mt-1">This business has not published services and team availability.</p></div> : (
              <>
                {step === 1 ? <div className="grid gap-6">
                  <div><h2 className="text-xl font-bold text-slate-900">What would you like to book?</h2><p className="mt-1 text-sm text-slate-500">Choose the service and professional that suit you best.</p></div>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">Service<select className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal" value={serviceId} onChange={(event) => selectService(event.target.value)}><option value="">Choose a service</option>{catalogQuery.data.services.map((item) => <option key={item.id} value={item.id}>{item.name}{item.durationMinutes ? ` · ${item.durationMinutes} min` : ''}{item.price ? ` · $${item.price}` : ''}</option>)}</select></label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">Preferred team member<select className="rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal" value={staffId} onChange={(event) => selectStaff(event.target.value)}><option value="">Choose a team member</option>{catalogQuery.data.staff.map((item) => <option key={item.id} value={item.id}>{item.name}{item.role ? ` · ${item.role}` : ''}</option>)}</select></label>
                  <div className="grid gap-2 text-sm font-semibold text-slate-700">
                    <span>Available date</span>
                    {!serviceId || !staffId ? <p className="rounded-xl bg-slate-50 p-4 font-normal text-slate-500">Choose a service and team member to see available dates.</p> : availabilityQuery.isLoading ? <p className="rounded-xl bg-slate-50 p-4 font-normal text-slate-500">Checking available dates...</p> : availabilityQuery.isError ? <p className="rounded-xl bg-rose-50 p-4 font-normal text-rose-700">Availability could not be loaded. Please try again.</p> : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between">
                          <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40" type="button" aria-label="Previous month" disabled={monthCursor <= monthFor(availabilityFrom)} onClick={() => {
                            const previous = new Date(`${monthCursor}-01T12:00:00Z`)
                            previous.setUTCMonth(previous.getUTCMonth() - 1)
                            setMonthCursor(previous.toISOString().slice(0, 7))
                          }}>‹</button>
                          <p className="text-sm font-bold text-slate-800">{formatMonth(monthCursor)}</p>
                          <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40" type="button" aria-label="Next month" disabled={monthCursor >= monthFor(availabilityTo)} onClick={() => {
                            const next = new Date(`${monthCursor}-01T12:00:00Z`)
                            next.setUTCMonth(next.getUTCMonth() + 1)
                            setMonthCursor(next.toISOString().slice(0, 7))
                          }}>›</button>
                        </div>
                        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
                        </div>
                        <div className="mt-2 grid grid-cols-7 gap-1">
                          {calendarDays.map((calendarDate) => {
                            const inMonth = monthFor(calendarDate) === monthCursor
                            const available = availableDates.has(calendarDate)
                            const selected = selectedDate === calendarDate
                            return <button
                              className={`relative min-h-10 rounded-lg border px-1 py-2 text-sm ${!inMonth ? 'border-transparent text-slate-300' : available ? selected ? 'border-[#18234a] bg-[#18234a] font-bold text-white' : 'border-indigo-200 bg-white font-semibold text-indigo-700 hover:border-[#18234a]' : 'border-transparent text-slate-300'} disabled:cursor-not-allowed`}
                              type="button"
                              key={calendarDate}
                              disabled={!inMonth || !available}
                              aria-label={available ? `Select ${calendarDate}` : `${calendarDate} unavailable`}
                              onClick={() => selectDate(calendarDate)}
                            >
                              {formatCalendarDay(calendarDate)}
                              {available ? <span className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${selected ? 'bg-white' : 'bg-indigo-500'}`} /> : null}
                            </button>
                          })}
                        </div>
                        <p className="mt-3 font-normal text-slate-500">Highlighted dates have available times. Times are shown in {businessTimezone}.</p>
                      </div>
                    )}
                  </div>
                  <button className="rounded-xl bg-[#18234a] px-4 py-3 font-semibold text-white hover:bg-[#24345f] disabled:cursor-not-allowed disabled:opacity-50" type="button" disabled={!canContinueToTimes} onClick={() => setStep(2)}>Find available times</button>
                </div> : null}

                {step === 2 ? <div className="grid gap-6">
                  <div><h2 className="text-xl font-bold text-slate-900">Choose a time</h2><p className="mt-1 text-sm text-slate-500">{service?.name} with {staffMember?.name} on {formatDate(selectedDate)}.</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FiClock aria-hidden="true" />Available times · {businessTimezone}</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{slotsQuery.isLoading ? <p className="col-span-full py-4 text-sm text-slate-500">Finding available times...</p> : slotsQuery.isError ? <div className="col-span-full py-4 text-sm text-rose-700">Availability could not be loaded. <button className="font-semibold underline" type="button" onClick={() => void slotsQuery.refetch()}>Try again</button></div> : slotsQuery.data?.length ? slotsQuery.data.map((item) => <button className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${slot?.startTime === item.startTime ? 'border-[#18234a] bg-[#18234a] text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-[#18234a]'}`} type="button" key={item.startTime} onClick={() => setSlot(item)}>{formatTime(item.startTime, businessTimezone)}</button>) : <div className="col-span-full rounded-xl bg-white p-4 text-sm text-slate-600"><p>No times are available on this date.</p><button className="mt-3 font-semibold text-indigo-700 underline" type="button" onClick={() => { setDate(''); setSlot(null); setStep(1) }}>Choose another available date</button></div>}</div></div>
                  <button className="rounded-xl bg-[#18234a] px-4 py-3 font-semibold text-white hover:bg-[#24345f] disabled:cursor-not-allowed disabled:opacity-50" type="button" disabled={!slot} onClick={() => setStep(3)}>Continue with selected time</button>
                </div> : null}

                {step === 3 ? <div className="grid gap-6">
                  <div><h2 className="text-xl font-bold text-slate-900">Your details</h2><p className="mt-1 text-sm text-slate-500">We use this information to confirm your request.</p></div>
                  {summary ? <div className="rounded-2xl bg-slate-50 p-4 text-sm"><p className="font-semibold text-slate-900">{summary.service} · {summary.date}</p><p className="mt-1 text-slate-600">{summary.time} with {summary.staff}</p></div> : null}
                  <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold text-slate-700">Full name<input className="rounded-xl border border-slate-300 px-3 py-3 font-normal" placeholder="Your name" value={customer.customerName} onChange={(event) => setCustomer({ ...customer, customerName: event.target.value })} required /></label><label className="grid gap-2 text-sm font-semibold text-slate-700">Email address<input className="rounded-xl border border-slate-300 px-3 py-3 font-normal" placeholder="you@example.com" type="email" value={customer.customerEmail} onChange={(event) => setCustomer({ ...customer, customerEmail: event.target.value })} required /></label><label className="grid gap-2 text-sm font-semibold text-slate-700">Phone <span className="font-normal text-slate-500">(optional)</span><input className="rounded-xl border border-slate-300 px-3 py-3 font-normal" placeholder="Your phone number" value={customer.customerPhone} onChange={(event) => setCustomer({ ...customer, customerPhone: event.target.value })} /></label><label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">Notes <span className="font-normal text-slate-500">(optional)</span><textarea className="min-h-24 rounded-xl border border-slate-300 px-3 py-3 font-normal" placeholder="Anything the team should know?" value={customer.notes} onChange={(event) => setCustomer({ ...customer, notes: event.target.value })} /></label></div>
                  <label className="flex items-start gap-3 text-sm text-slate-600"><input className="mt-1 h-4 w-4 rounded border-slate-300" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I agree to be contacted about this appointment request and understand that it is pending until the business confirms it.</span></label>
                  {user?.role === 'CUSTOMER' ? <button className="rounded-xl bg-[#18234a] px-4 py-3 font-semibold text-white hover:bg-[#24345f] disabled:cursor-not-allowed disabled:opacity-50" type="button" disabled={!canSubmit || bookingMutation.isPending} onClick={() => bookingMutation.mutate()}>{bookingMutation.isPending ? 'Sending request...' : 'Request appointment'}</button> : <Link className="rounded-xl bg-[#18234a] px-4 py-3 text-center font-semibold text-white" to={`/customer/login?returnTo=/book/${tenantId}`}>Sign in to book</Link>}
                  {bookingMutation.isError ? <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">That time may have just been taken. Return to time selection and choose another slot.</p> : null}
                </div> : null}
              </>
            )}
          </section>

          <aside className="h-fit rounded-3xl border border-white/10 bg-white/10 p-5 text-sm text-slate-200">
            <p className="font-semibold text-white">Your booking</p>
            <div className="mt-4 grid gap-3">
              <p className="flex items-start gap-2"><FiMapPin className="mt-0.5 shrink-0" aria-hidden="true" /><span>{businessName}<br /><span className="text-xs text-slate-400">Online appointment request</span></span></p>
              {service ? <p><span className="text-slate-400">Service</span><br /><span className="font-semibold text-white">{service.name}</span></p> : null}
              {staffMember ? <p><span className="text-slate-400">Team member</span><br /><span className="font-semibold text-white">{staffMember.name}</span></p> : null}
              {slot ? <p><span className="text-slate-400">Date and time</span><br /><span className="font-semibold text-white">{formatDate(selectedDate)}<br />{formatTime(slot.startTime, businessTimezone)} - {formatTime(slot.endTime, businessTimezone)}</span></p> : <p className="text-slate-400">Your selected service, date, and time will appear here.</p>}
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
