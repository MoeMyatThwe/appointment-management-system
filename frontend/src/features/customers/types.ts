export interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  notes?: string
  customerGroup?: string
  tags?: string
}

export interface CustomerListResponse {
  items: Customer[]
}

export interface CreateCustomerInput {
  name: string
  email: string
  phone?: string
  notes?: string
  customerGroup?: string
  tags?: string
}

export interface UpdateCustomerInput extends CreateCustomerInput {}
