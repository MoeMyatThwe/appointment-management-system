import { httpClient } from '../../shared/api/httpClient'
import type {
  CreateCustomerInput,
  Customer,
  CustomerListResponse,
  UpdateCustomerInput,
} from './types'
import type { Appointment } from '../appointments/types'
import type { PageResponse } from '../../shared/types/pagination'

export interface CustomerPageQuery {
  page: number
  size: number
  sortBy?: string
  direction?: 'asc' | 'desc'
  query?: string
  group?: string
  tag?: string
}

export async function fetchCustomers(query?: string) {
  const { data } = await httpClient.get<CustomerListResponse | PageResponse<Customer> | Customer[]>('/api/customers', {
    params: query ? { query } : undefined,
  })
  if (Array.isArray(data)) return data
  if ('content' in data) return data.content
  return data.items
}

export async function fetchCustomersPage(query: CustomerPageQuery) {
  const { data } = await httpClient.get<PageResponse<Customer>>('/api/customers', {
    params: {
      page: query.page,
      size: query.size,
      sortBy: query.sortBy || undefined,
      direction: query.direction,
      query: query.query || undefined,
      group: query.group || undefined,
      tag: query.tag || undefined,
    },
  })
  return data
}

export async function searchCustomers(query = '') {
  const data = await fetchCustomersPage({ page: 0, size: 20, query, sortBy: 'name', direction: 'asc' })
  return data.content
}

export async function createCustomer(input: CreateCustomerInput) {
  const { data } = await httpClient.post<Customer>('/api/customers', input)
  return data
}

export async function updateCustomer(customerId: string, input: UpdateCustomerInput) {
  const { data } = await httpClient.put<Customer>(`/api/customers/${customerId}`, input)
  return data
}

export async function fetchCustomerAppointments(customerId: string) {
  const { data } = await httpClient.get<PageResponse<Appointment>>(`/api/customers/${customerId}/appointments`, {
    params: { page: 0, size: 10 },
  })
  return data
}

export async function fetchCustomerAppointmentsPage(customerId: string, page: number, size = 20) {
  const { data } = await httpClient.get<PageResponse<Appointment>>(`/api/customers/${customerId}/appointments`, {
    params: { page, size },
  })
  return data
}
