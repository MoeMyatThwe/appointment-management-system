import { httpClient } from '../../shared/api/httpClient'

export interface PlatformTenant {
  tenantId: string
  tenantName: string
  ownerEmail: string
  businessType?: string
  timezone?: string
  currency?: string
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DELETION_REQUESTED'
  subscriptionPlan: string
  subscriptionStatus: string
  deletionDueAt?: string
  active: boolean
  onboardingCompleted: boolean
}

export interface SubscriptionPlan {
  code: string
  name: string
  monthlyPriceCents: number
  staffLimit: number
  appointmentLimit: number
}

export async function fetchSubscriptionPlans() {
  const { data } = await httpClient.get<SubscriptionPlan[]>('/auth/platform/plans')
  return data
}

export async function setPlatformTenantPlan(tenantId: string, plan: string) {
  const { data } = await httpClient.patch<PlatformTenant>(
    `/auth/platform/tenants/${tenantId}/plan`,
    null,
    { params: { plan } },
  )
  return data
}

export async function fetchPlatformTenants() {
  const { data } = await httpClient.get<PlatformTenant[]>('/auth/platform/tenants')
  return data
}

export async function setPlatformTenantStatus(tenantId: string, active: boolean) {
  const { data } = await httpClient.patch<PlatformTenant>(
    `/auth/platform/tenants/${tenantId}/status`,
    null,
    { params: { active } },
  )
  return data
}

export async function requestPlatformTenantDeletion(tenantId: string) {
  const { data } = await httpClient.post<PlatformTenant>(`/auth/platform/tenants/${tenantId}/deletion-request`)
  return data
}

export async function exportPlatformTenant(tenantId: string) {
  const { data } = await httpClient.get(`/auth/platform/tenants/${tenantId}/export`)
  return data
}

export interface SupportAccess {
  id: string
  tenantId: string
  requestedBy: string
  reason: string
  durationMinutes: number
  status: string
  createdAt: string
  expiresAt?: string
}

export async function fetchSupportAccess() {
  const { data } = await httpClient.get<SupportAccess[]>('/auth/platform/support-access')
  return data
}

export async function requestSupportAccess(tenantId: string, reason: string, durationMinutes: number) {
  const { data } = await httpClient.post<SupportAccess>(`/auth/platform/tenants/${tenantId}/support-access`, { reason, durationMinutes })
  return data
}

export async function revokeSupportAccess(id: string) {
  const { data } = await httpClient.post<SupportAccess>(`/auth/platform/support-access/${id}/revoke`)
  return data
}

export interface PlatformSetting { key: string; value: string }
export interface FeatureFlag { key: string; enabled: boolean }

export async function fetchPlatformSettings() {
  const { data } = await httpClient.get<PlatformSetting[]>('/auth/platform/settings')
  return data
}

export async function setPlatformSetting(key: string, value: string) {
  const { data } = await httpClient.patch<PlatformSetting>(`/auth/platform/settings/${key}`, null, { params: { value } })
  return data
}

export async function fetchTenantFlags(tenantId: string) {
  const { data } = await httpClient.get<FeatureFlag[]>(`/auth/platform/tenants/${tenantId}/flags`)
  return data
}

export async function setTenantFlag(tenantId: string, key: string, enabled: boolean) {
  const { data } = await httpClient.patch<FeatureFlag>(`/auth/platform/tenants/${tenantId}/flags/${key}`, null, { params: { enabled } })
  return data
}

export interface PlatformAuditEvent {
  id: string
  actorEmail: string
  actorRole: string
  tenantId?: string
  action: string
  details: string
  createdAt: string
}

export async function fetchPlatformAuditEvents(filters: { tenantId?: string; actor?: string; action?: string }) {
  const { data } = await httpClient.get<PlatformAuditEvent[]>('/auth/platform/audit-events', { params: filters })
  return data
}

export async function fetchCurrentTenantFlags() {
  const { data } = await httpClient.get<FeatureFlag[]>('/auth/tenant-flags')
  return data
}
