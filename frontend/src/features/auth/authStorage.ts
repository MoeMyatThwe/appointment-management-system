const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const TENANT_ID_KEY = 'tenantId'
const TIMEZONE_KEY = 'timezone'

export function setSession(
  accessToken: string,
  tenantId?: string,
  refreshToken?: string,
) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (tenantId) {
    localStorage.setItem(TENANT_ID_KEY, tenantId)
  } else {
    localStorage.removeItem(TENANT_ID_KEY)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function setTimezone(timezone: string) {
  localStorage.setItem(TIMEZONE_KEY, timezone)
}

export function getTimezone() {
  return localStorage.getItem(TIMEZONE_KEY)
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TENANT_ID_KEY)
  localStorage.removeItem(TIMEZONE_KEY)
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getTenantId() {
  return localStorage.getItem(TENANT_ID_KEY)
}
