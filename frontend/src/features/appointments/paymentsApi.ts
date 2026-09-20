import { httpClient } from '../../shared/api/httpClient'
import type { AppointmentPayment, RecordPaymentInput } from './types'
import type { PaymentHistory } from './types'

export async function fetchAppointmentPayment(appointmentId: string) {
  const { data } = await httpClient.get<AppointmentPayment>(`/api/appointments/${appointmentId}/payment`)
  return data
}

export async function recordAppointmentPayment(appointmentId: string, input: RecordPaymentInput) {
  const { data } = await httpClient.put<AppointmentPayment>(`/api/appointments/${appointmentId}/payment`, input)
  return data
}

export async function refundAppointmentPayment(appointmentId: string) {
  const { data } = await httpClient.patch<AppointmentPayment>(`/api/appointments/${appointmentId}/payment/refund`)
  return data
}

export async function fetchPaymentHistory(appointmentId: string) {
  const { data } = await httpClient.get<PaymentHistory[]>(`/api/appointments/${appointmentId}/payment/history`)
  return data
}

export async function createStripeCheckout(appointmentId: string) {
  const { data } = await httpClient.post<{ checkoutUrl: string }>(`/api/appointments/${appointmentId}/payment/checkout`)
  return data
}
