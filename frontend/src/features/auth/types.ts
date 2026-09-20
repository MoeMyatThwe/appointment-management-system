export type UserRole = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'MANAGER' | 'STAFF' | 'CUSTOMER'

export interface CurrentUser {
  id: string
  tenantId: string
  name: string
  email: string
  role: UserRole
  tenantName: string
  timezone: string
  onboardingCompleted: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken?: string
  tenantId: string
}

export interface WorkspaceProfile {
  tenantName: string
  businessType: string
  businessPhone: string
  timezone: string
  currency: string
  onboardingCompleted: boolean
}
