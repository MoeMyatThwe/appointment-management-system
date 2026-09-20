import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiCheck, FiHome } from 'react-icons/fi'
import { cancelPublicBooking, fetchPublicBooking, fetchPublicCatalog, fetchPublicSlots, reschedulePublicBooking } from '../publicBookingApi'

function localDate(value: string) {
  return new Date(value).toLocaleDateString('en-CA')
}

export function PublicBookingManagePage() {
  const { tenantId = '', token = '' } = useParams()
  const navigate = useNavigate()
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState<{ startTime: string; endTime: string } | null>(null)
  const booking = useQuery({ queryKey: ['public-booking', tenantId, token], queryFn: () => fetchPublicBooking(tenantId, token), enabled: Boolean(tenantId && token) })
  const catalog = useQuery({ queryKey: ['public-catalog', tenantId], queryFn: () => fetchPublicCatalog(tenantId), enabled: Boolean(tenantId) })
  const slots = useQuery({
    queryKey: ['public-manage-slots', tenantId, date, booking.data?.serviceId, booking.data?.staffId],
    queryFn: () => fetchPublicSlots(tenantId, date, booking.data!.serviceId, booking.data!.staffId),
    enabled: Boolean(date && booking.data?.serviceId && booking.data?.staffId),
  })
  const cancel = useMutation({ mutationFn: () => cancelPublicBooking(tenantId, token), onSuccess: () => void booking.refetch() })
  const reschedule = useMutation({
    mutationFn: () => reschedulePublicBooking(tenantId, token, slot!),
    onSuccess: () => { setSlot(null); void booking.refetch() },
  })
  const service = catalog.data?.services.find((item) => item.id === booking.data?.serviceId)
  const staff = catalog.data?.staff.find((item) => item.id === booking.data?.staffId)
  const canChange = booking.data && ['PENDING', 'CONFIRMED'].includes(booking.data.status)
  const title = useMemo(() => booking.data ? `${service?.name ?? 'Appointment'} with ${staff?.name ?? 'your team member'}` : 'Manage appointment', [booking.data, service, staff])

  return (
    <main className="min-h-screen bg-[#18234a] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        <nav className="mb-8 flex items-center justify-between text-sm text-slate-300" aria-label="Booking navigation">
          <button className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 hover:text-white" type="button" onClick={() => navigate(`/book/${tenantId}`)}><FiArrowLeft aria-hidden="true" />Back to booking</button>
          <button className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10 hover:text-white" type="button" onClick={() => navigate('/')}><FiHome aria-hidden="true" />Home</button>
        </nav>
        <section className="rounded-3xl bg-white p-7 shadow-2xl">
          {booking.isLoading ? <p className="text-sm text-slate-500">Loading appointment...</p> : booking.isError || !booking.data ? <div className="text-sm text-rose-700"><p className="font-semibold">This booking link is invalid or expired.</p><p className="mt-2">Request a new booking link from the business.</p></div> : (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">Manage appointment</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
              <p className="mt-2 text-sm text-slate-500">{new Date(booking.data.startTime).toLocaleString()} · Status: {booking.data.status.replace('_', ' ')}</p>
              {booking.data.status === 'CANCELLED' ? <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">This appointment has been cancelled.</p> : null}
              {canChange ? <div className="mt-7 grid gap-4">
                <div className="rounded-2xl bg-slate-50 p-4"><p className="font-semibold text-slate-800">Choose a new time</p><div className="mt-3 flex gap-2"><input className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5" type="date" min={localDate(new Date().toISOString())} value={date} onChange={(event) => { setDate(event.target.value); setSlot(null) }} /><button className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700" type="button" onClick={() => void slots.refetch()} disabled={!date}>Find times</button></div>{slots.isLoading ? <p className="mt-3 text-sm text-slate-500">Finding available times...</p> : slots.data?.length ? <div className="mt-3 grid grid-cols-3 gap-2">{slots.data.map((item) => <button className={`rounded-lg border px-2 py-2 text-xs font-semibold ${slot?.startTime === item.startTime ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`} type="button" key={item.startTime} onClick={() => setSlot(item)}>{new Date(item.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</button>)}</div> : date && !slots.isLoading ? <p className="mt-3 text-sm text-slate-500">No times available on this date.</p> : null}</div>
                <button className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50" type="button" disabled={!slot || reschedule.isPending} onClick={() => reschedule.mutate()}>{reschedule.isPending ? 'Updating...' : 'Reschedule appointment'}</button>
                <button className="rounded-xl border border-rose-300 px-4 py-3 font-semibold text-rose-700 disabled:opacity-50" type="button" disabled={cancel.isPending} onClick={() => { if (window.confirm('Cancel this appointment?')) cancel.mutate() }}>{cancel.isPending ? 'Cancelling...' : 'Cancel appointment'}</button>
                {reschedule.isError || cancel.isError ? <p className="text-sm text-rose-700" role="alert">This appointment could not be updated. It may be within the two-hour change window.</p> : null}
              </div> : null}
              {cancel.isSuccess || reschedule.isSuccess ? <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"><FiCheck aria-hidden="true" />Appointment updated successfully.</p> : null}
            </>
          )}
        </section>
      </div>
    </main>
  )
}
