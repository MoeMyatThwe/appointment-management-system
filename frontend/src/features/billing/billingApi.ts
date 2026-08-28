import { httpClient } from '../../shared/api/httpClient'

export interface Subscription {
  plan: string
  status: string
  monthlyPriceCents: number
  currency: string
}

export interface SubscriptionPlan {
  code: string
  name: string
  monthlyPriceCents: number
  staffLimit: number
  appointmentLimit: number
}

export async function fetchSubscription() {
  const { data } = await httpClient.get<Subscription>('/auth/subscription')
  return data
}

export async function fetchPlans() {
  const { data } = await httpClient.get<SubscriptionPlan[]>('/auth/plans')
  return data
}

export async function createSubscriptionCheckout(plan: string) {
  const { data } = await httpClient.post<{ checkoutUrl: string }>('/auth/subscription/checkout', { plan })
  return data
}

export async function cancelSubscription() {
  const { data } = await httpClient.post<Subscription>('/auth/subscription/cancel')
  return data
}
