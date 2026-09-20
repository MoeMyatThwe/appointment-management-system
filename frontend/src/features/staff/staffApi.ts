import { httpClient } from '../../shared/api/httpClient'
import type { CreateStaffInput, Staff } from './types'
import type { PageResponse } from '../../shared/types/pagination'
import type { Appointment } from '../appointments/types'
export async function fetchStaff() { const { data } = await httpClient.get<Staff[]>('/api/staff'); return data }
export async function fetchStaffPage(query: { page: number; size: number; sortBy?: string; direction?: 'asc' | 'desc'; query?: string; role?: string }) {
  const { data } = await httpClient.get<PageResponse<Staff>>('/api/staff', { params: {
    page: query.page, size: query.size, sortBy: query.sortBy || undefined,
    direction: query.direction, query: query.query || undefined, role: query.role || undefined,
  } })
  return data
}
export async function searchStaff(query = '') {
  const data = await fetchStaffPage({ page: 0, size: 20, query, sortBy: 'name', direction: 'asc' })
  return data.content
}
export async function createStaff(input: CreateStaffInput) { const { data } = await httpClient.post<Staff>('/api/staff', input); return data }
export async function updateStaff(id: string, input: CreateStaffInput) { const { data } = await httpClient.put<Staff>(`/api/staff/${id}`, input); return data }
export async function deleteStaff(id: string) { await httpClient.delete(`/api/staff/${id}`) }
export interface StaffTimeOff { id: string; staffId: string; startTime: string; endTime: string; reason?: string }
export async function fetchStaffTimeOff(staffId: string) {
  const { data } = await httpClient.get<PageResponse<StaffTimeOff>>(`/api/staff/${staffId}/time-off`, {
    params: { page: 0, size: 10 },
  })
  return data
}
export async function fetchStaffTimeOffPage(staffId: string, page: number, size = 20) {
  const { data } = await httpClient.get<PageResponse<StaffTimeOff>>(`/api/staff/${staffId}/time-off`, {
    params: { page, size },
  })
  return data
}
export async function fetchStaffAppointmentsPage(staffId: string, page: number, size = 20) {
  const { data } = await httpClient.get<PageResponse<Appointment>>(`/api/staff/${staffId}/appointments`, {
    params: { page, size },
  })
  return data
}
export async function addStaffTimeOff(staffId: string, input: Omit<StaffTimeOff, 'id' | 'staffId'>) {
  const { data } = await httpClient.post<StaffTimeOff>(`/api/staff/${staffId}/time-off`, { ...input, staffId })
  return data
}
