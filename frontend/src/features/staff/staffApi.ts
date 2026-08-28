import { httpClient } from '../../shared/api/httpClient'
import type { CreateStaffInput, Staff } from './types'
export async function fetchStaff() { const { data } = await httpClient.get<Staff[]>('/api/staff'); return data }
export async function createStaff(input: CreateStaffInput) { const { data } = await httpClient.post<Staff>('/api/staff', input); return data }
export async function updateStaff(id: string, input: CreateStaffInput) { const { data } = await httpClient.put<Staff>(`/api/staff/${id}`, input); return data }
export async function deleteStaff(id: string) { await httpClient.delete(`/api/staff/${id}`) }
