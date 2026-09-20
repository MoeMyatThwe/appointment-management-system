import { httpClient } from '../../shared/api/httpClient'
import type { Appointment } from '../appointments/types'

export interface DashboardSummary {
  appointmentsToday: number
  upcomingAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  customerCount: number
  staffCount: number
  serviceCount: number
  nextAppointments: Appointment[]
}

export interface ServiceDemand {
  serviceId: string
  serviceName: string
  appointmentCount: number
}

export interface ReportSummary {
  totalAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  customerCount: number
  serviceDemand: ServiceDemand[]
}

export async function fetchDashboardSummary() {
  const { data } = await httpClient.get<DashboardSummary>('/api/appointments/dashboard/summary')
  return data
}

export async function fetchReportSummary(from?: string, to?: string) {
  const { data } = await httpClient.get<ReportSummary>('/api/appointments/reports/summary', {
    params: { from: from || undefined, to: to || undefined },
  })
  return data
}

export async function downloadReportCsv(type: 'appointments' | 'customers', from?: string, to?: string) {
  const { data } = await httpClient.get<Blob>(`/api/appointments/reports/export/${type}`, {
    params: { from: from || undefined, to: to || undefined },
    responseType: 'blob',
  })
  return data
}
