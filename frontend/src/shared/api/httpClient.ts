import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearSession, getRefreshToken, setSession } from '../../features/auth/authStorage'

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
const API_BASE_URL = configuredBaseUrl && configuredBaseUrl !== '/' ? configuredBaseUrl.replace(/\/$/, '') : '/'

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _authRetry?: boolean
}

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  const tenantId = localStorage.getItem('tenantId')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (tenantId && tenantId !== 'undefined' && tenantId !== 'null') {
    config.headers['X-Tenant-Id'] = tenantId
  }

  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableRequestConfig | undefined
    const requestUrl = original?.url ?? ''
    const isAuthRequest = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'].some((path) =>
      requestUrl.endsWith(path),
    )
    const refreshToken = getRefreshToken()

    if (error.response?.status !== 401 || !original || original._authRetry || isAuthRequest || !refreshToken) {
      if (error.response?.status === 401 && !refreshToken && !isAuthRequest) clearSession()
      return Promise.reject(error)
    }

    original._authRetry = true
    try {
      const { data } = await axios.post<{ accessToken: string; refreshToken: string; tenantId: string }>(
        API_BASE_URL === '/' ? '/auth/refresh' : `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      )
      setSession(data.accessToken, data.tenantId, data.refreshToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return httpClient(original)
    } catch (refreshError) {
      clearSession()
      return Promise.reject(refreshError)
    }
  },
)
