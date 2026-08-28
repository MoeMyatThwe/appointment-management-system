import { httpClient } from '../../shared/api/httpClient'
import type {
  CreateCustomerInput,
  Customer,
  CustomerListResponse,
  UpdateCustomerInput,
} from './types'
import type { Appointment } from '../appointments/types'

export async function fetchCustomers(query?: string) {
  const { data } = await httpClient.get<CustomerListResponse | Customer[]>('/api/customers', {
    params: query ? { query } : undefined,
  })
  return Array.isArray(data) ? data : data.items
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
  const { data } = await httpClient.get<Appointment[]>(`/api/customers/${customerId}/appointments`)
  return data
}
