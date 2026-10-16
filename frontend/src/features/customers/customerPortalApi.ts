import { httpClient } from '../../shared/api/httpClient'
import type { PageResponse } from '../../shared/types/pagination'

export interface CustomerPortalAppointment {
  id: string
  tenantId: string
  serviceId: string
  serviceName: string
  staffId: string
  staffName: string
  startTime: string
  endTime: string
  status: string
  notes: string
  paymentStatus: string
  amountDue: number | null
  amountPaid: number | null
  balance: number | null
  refundStatus: string
}

export interface PublicBusiness {
  tenantId: string
  name: string
  timezone: string
  serviceCount: number
}

export interface CustomerAppointmentFilters {
  page: number
  size: number
  search: string
  status: string
  paymentStatus: string
  dateFilter: 'ALL' | 'UPCOMING' | 'PAST'
}

export async function fetchCustomerAppointments(filters: CustomerAppointmentFilters) {
  const { data } = await httpClient.get<PageResponse<CustomerPortalAppointment>>('/api/customer/appointments', {
    params: filters,
  })
  return data
}

export async function fetchPublicBusinesses() {
  const { data } = await httpClient.get<PublicBusiness[]>('/public/booking/businesses')
  return data
}

export async function createCustomerCheckout(appointmentId: string) {
  const { data } = await httpClient.post<{ checkoutUrl: string }>(`/api/customer/appointments/${appointmentId}/payment/checkout`)
  return data
}

export async function cancelCustomerAppointment(appointmentId: string) {
  const { data } = await httpClient.post(`/api/customer/appointments/${appointmentId}/cancel`)
  return data
}

export async function confirmCustomerPayment(appointmentId: string, sessionId: string) {
  const { data } = await httpClient.post(`/api/customer/appointments/${appointmentId}/payment/confirm`, undefined, { params: { sessionId } })
  return data
}
