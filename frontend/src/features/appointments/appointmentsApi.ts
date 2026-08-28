import { httpClient } from '../../shared/api/httpClient'
import type {
  Appointment,
  AppointmentListResponse,
  CreateAppointmentInput,
  PaginatedAppointmentResponse,
} from './types'

interface AppointmentQuery {
  from?: string
  to?: string
  staffId?: string
  customerId?: string
  status?: string
}

export interface AppointmentSearchQuery extends AppointmentQuery {
  search?: string
  serviceId?: string
  resourceId?: string
  page?: number
  size?: number
  sortBy?: string
  direction?: 'asc' | 'desc'
}

export async function fetchAppointments(query: AppointmentQuery = {}) {
  const { data } = await httpClient.get<AppointmentListResponse | Appointment[]>(
    '/api/appointments',
    { params: query },
  )
  return Array.isArray(data) ? data : data.items
}

export async function searchAppointments(query: AppointmentSearchQuery = {}) {
  const { data } = await httpClient.get<PaginatedAppointmentResponse>(
    '/api/appointments/search',
    { params: query },
  )
  return data
}

export async function createAppointment(input: CreateAppointmentInput) {
  const { data } = await httpClient.post<Appointment>('/api/appointments', {
    businessId: localStorage.getItem('businessId') ?? 'default-business',
    calendarId: localStorage.getItem('calendarId') ?? 'default-calendar',
    customerId: input.customerId,
    staffId: input.staffId,
    serviceId: input.serviceId,
    resourceId: input.resourceId,
    startTime: input.startAtUtc,
    endTime: input.endAtUtc,
    status: 'PENDING',
    notes: input.notes,
  })
  return data
}

export async function rescheduleAppointment(
  appointmentId: string,
  startAtUtc: string,
  endAtUtc: string,
) {
  const { data } = await httpClient.patch<Appointment>(
    `/api/appointments/${appointmentId}/reschedule`,
    { startTime: startAtUtc, endTime: endAtUtc },
  )
  return data
}

export async function cancelAppointment(appointmentId: string) {
  const { data } = await httpClient.patch<Appointment>(
    `/api/appointments/${appointmentId}/cancel`,
  )
  return data
}
