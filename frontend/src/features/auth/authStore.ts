import { create } from 'zustand'
import { clearSession, getAccessToken, getRefreshToken, setSession, setTimezone } from './authStorage'
import type { CurrentUser } from './types'
import { customerLogin, fetchCurrentUser, login as loginRequest, logout as logoutRequest, registerCustomer } from './authApi'
import { getApiErrorMessage } from '../../shared/api/apiError'

interface LoginInput {
  email: string
  password: string
}

interface AuthStore {
  user: CurrentUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  hydrate: () => Promise<void>
  login: (input: LoginInput, customer?: boolean) => Promise<void>
  registerCustomer: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  hydrate: async () => {
    const token = getAccessToken()
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const user = await fetchCurrentUser()
      setTimezone(user.timezone)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      clearSession()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
  login: async (input, customer = false) => {
    set({ isLoading: true, error: null })
    try {
      const session = await (customer ? customerLogin(input) : loginRequest(input))
      setSession(session.accessToken, session.tenantId, session.refreshToken)
      const user = await fetchCurrentUser()
      setTimezone(user.timezone)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      clearSession()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: getApiErrorMessage(error, 'login'),
      })
      throw error
    }
  },
  registerCustomer: async (input) => {
    set({ isLoading: true, error: null })
    try {
      const session = await registerCustomer(input)
      setSession(session.accessToken, session.tenantId, session.refreshToken)
      const user = await fetchCurrentUser()
      setTimezone(user.timezone)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      clearSession()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: getApiErrorMessage(error, 'register'),
      })
      throw error
    }
  },
  logout: async () => {
    set({ isLoading: true, error: null })
    try {
      await logoutRequest(getRefreshToken() ?? undefined)
    } finally {
      clearSession()
      set({ user: null, isAuthenticated: false, isLoading: false, error: null })
    }
  },
}))
