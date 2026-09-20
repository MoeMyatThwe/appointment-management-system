export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export interface Appointment {
  id: string
  businessId?: string
  customerId: string
  staffId: string
  serviceId: string
  resourceId?: string
  calendarId?: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  notes?: string
}

export interface AppointmentListResponse {
  items: Appointment[]
}

export interface PaginatedAppointmentResponse {
  content: Appointment[]
  number: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface AppointmentPayment {
  id?: string
  appointmentId: string
  amountDue: number
  amountPaid: number
  balance: number
  currency: string
  paymentMethod?: string
  status: 'UNPAID' | 'PENDING' | 'FAILED' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED'
  receiptNumber: string
  updatedAt: string
  stripeCheckoutSessionId?: string
  stripePaymentIntentId?: string
}

export interface RecordPaymentInput {
  amountPaid: number
  paymentMethod: string
  currency: string
  status?: 'UNPAID' | 'PENDING' | 'FAILED' | 'PARTIALLY_PAID' | 'PAID'
}

export interface PaymentHistory {
  id: string
  appointmentId: string
  amount: number
  type: string
  paymentMethod?: string
  status: string
  createdAt: string
}

export interface CreateAppointmentInput {
  customerId: string
  staffId: string
  serviceId: string
  startAtUtc: string
  endAtUtc: string
  resourceId?: string
  notes?: string
}
