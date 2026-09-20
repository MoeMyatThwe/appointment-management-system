import { httpClient } from '../../shared/api/httpClient'

export interface PublicBookingCatalog {
  businessName: string
  services: { id: string; name: string; durationMinutes?: number; price?: string; color?: string }[]
  staff: { id: string; name: string; email?: string; role?: string }[]
}

export interface PublicSlot { startTime: string; endTime: string }

export async function fetchPublicCatalog(tenantId: string) {
  const { data } = await httpClient.get<PublicBookingCatalog>(`/public/booking/${tenantId}/catalog`)
  return data
}

export async function fetchPublicSlots(tenantId: string, date: string, serviceId: string, staffId: string) {
  const { data } = await httpClient.get<PublicSlot[]>(`/public/booking/${tenantId}/slots`, {
    params: { date, serviceId, staffId, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' },
  })
  return data
}

export async function submitPublicBooking(tenantId: string, input: {
  serviceId: string; staffId: string; startTime: string; endTime: string
  customerName: string; customerEmail: string; customerPhone?: string; notes?: string
}, idempotencyKey: string) {
  const { data } = await httpClient.post(`/public/booking/${tenantId}/appointments`, input, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return data
}

export interface PublicManagedAppointment {
  id: string
  staffId: string
  serviceId: string
  startTime: string
  endTime: string
  status: string
  notes?: string
}

export async function fetchPublicBooking(tenantId: string, token: string) {
  const { data } = await httpClient.get<PublicManagedAppointment>(`/public/booking/${tenantId}/appointments/manage/${token}`)
  return data
}

export async function cancelPublicBooking(tenantId: string, token: string) {
  const { data } = await httpClient.post<PublicManagedAppointment>(`/public/booking/${tenantId}/appointments/manage/${token}/cancel`)
  return data
}

export async function reschedulePublicBooking(
  tenantId: string,
  token: string,
  input: { startTime: string; endTime: string },
) {
  const { data } = await httpClient.post<PublicManagedAppointment>(
    `/public/booking/${tenantId}/appointments/manage/${token}/reschedule`,
    input,
    { headers: { 'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } },
  )
  return data
}
