import { httpClient } from '../../shared/api/httpClient'
import type { CreateServiceInput, Service } from './types'
import type { PageResponse } from '../../shared/types/pagination'
export async function fetchServices() { const { data } = await httpClient.get<Service[]>('/api/services'); return data }
export async function fetchServicesPage(query: { page: number; size: number; sortBy?: string; direction?: 'asc' | 'desc'; query?: string; minDuration?: string; maxDuration?: string }) {
  const { data } = await httpClient.get<PageResponse<Service>>('/api/services', { params: {
    page: query.page, size: query.size, sortBy: query.sortBy || undefined,
    direction: query.direction, query: query.query || undefined,
    minDuration: query.minDuration || undefined, maxDuration: query.maxDuration || undefined,
  } })
  return data
}
export async function searchServices(query = '') {
  const data = await fetchServicesPage({ page: 0, size: 20, query, sortBy: 'name', direction: 'asc' })
  return data.content
}
export async function createService(input: CreateServiceInput) { const { data } = await httpClient.post<Service>('/api/services', input); return data }
