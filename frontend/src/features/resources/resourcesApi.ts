import { httpClient } from '../../shared/api/httpClient'
import type { CreateResourceInput, Resource } from './types'
import type { PageResponse } from '../../shared/types/pagination'

export async function fetchResources() {
  const { data } = await httpClient.get<Resource[]>('/api/resources')
  return data
}

export async function fetchResourcesPage(query: { page: number; size: number; sortBy?: string; direction?: 'asc' | 'desc'; query?: string; resourceType?: string; active?: string }) {
  const { data } = await httpClient.get<PageResponse<Resource>>('/api/resources', { params: {
    page: query.page, size: query.size, sortBy: query.sortBy || undefined,
    direction: query.direction, query: query.query || undefined,
    resourceType: query.resourceType || undefined, active: query.active || undefined,
  } })
  return data
}
export async function searchResources(query = '') {
  const data = await fetchResourcesPage({ page: 0, size: 20, query, active: 'true', sortBy: 'name', direction: 'asc' })
  return data.content
}

export async function createResource(input: CreateResourceInput) {
  const { data } = await httpClient.post<Resource>('/api/resources', input)
  return data
}
