import { httpClient } from '../../shared/api/httpClient'
import type { CreateServiceInput, Service } from './types'
export async function fetchServices() { const { data } = await httpClient.get<Service[]>('/api/services'); return data }
export async function createService(input: CreateServiceInput) { const { data } = await httpClient.post<Service>('/api/services', input); return data }
