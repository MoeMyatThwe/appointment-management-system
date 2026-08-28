import { create } from 'zustand'
import { clearSession, getAccessToken, getRefreshToken, setSession } from './authStorage'
import type { CurrentUser } from './types'
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest } from './authApi'

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
  login: (input: LoginInput) => Promise<void>
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
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      clearSession()
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },
  login: async (input) => {
    set({ isLoading: true, error: null })
    try {
      const session = await loginRequest(input)
      setSession(session.accessToken, session.tenantId, session.refreshToken)
      const user = await fetchCurrentUser()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      clearSession()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
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
