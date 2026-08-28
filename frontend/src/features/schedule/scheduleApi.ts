import { httpClient } from '../../shared/api/httpClient'
import type { BusinessHoliday, BusinessHours } from './types'

export async function fetchBusinessHours() {
  const { data } = await httpClient.get<BusinessHours[]>('/api/settings/business-hours')
  return data
}

export async function saveBusinessHours(hours: BusinessHours[]) {
  const { data } = await httpClient.put<BusinessHours[]>('/api/settings/business-hours', hours)
  return data
}

export async function fetchHolidays() {
  const { data } = await httpClient.get<BusinessHoliday[]>('/api/settings/holidays')
  return data
}

export async function addHoliday(input: Omit<BusinessHoliday, 'id'>) {
  const { data } = await httpClient.post<BusinessHoliday>('/api/settings/holidays', input)
  return data
}
