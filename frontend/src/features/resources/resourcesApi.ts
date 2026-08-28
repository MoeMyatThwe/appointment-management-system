import { httpClient } from '../../shared/api/httpClient'
import type { CreateResourceInput, Resource } from './types'

export async function fetchResources() {
  const { data } = await httpClient.get<Resource[]>('/api/resources')
  return data
}

export async function createResource(input: CreateResourceInput) {
  const { data } = await httpClient.post<Resource>('/api/resources', input)
  return data
}
