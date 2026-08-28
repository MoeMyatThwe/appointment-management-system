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
    params: { date, serviceId, staffId },
  })
  return data
}

export async function submitPublicBooking(tenantId: string, input: {
  serviceId: string; staffId: string; startTime: string; endTime: string
  customerName: string; customerEmail: string; customerPhone?: string; notes?: string
}) {
  const { data } = await httpClient.post(`/public/booking/${tenantId}/appointments`, input)
  return data
}
