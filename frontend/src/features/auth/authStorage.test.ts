import { beforeEach, describe, expect, it } from 'vitest'
import { clearSession, getAccessToken, getRefreshToken, setSession } from './authStorage'

function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size
    },
  } satisfies Storage
}

describe('auth storage', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: createStorage(),
    })
  })

  it('clears legacy tokens so expired sessions cannot be reused', () => {
    localStorage.setItem('access_token', 'expired-access')
    localStorage.setItem('refresh_token', 'expired-refresh')

    clearSession()

    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('migrates legacy tokens when a new session is stored', () => {
    localStorage.setItem('access_token', 'legacy-access')
    localStorage.setItem('refresh_token', 'legacy-refresh')

    setSession('current-access', 'tenant', 'current-refresh')

    expect(getAccessToken()).toBe('current-access')
    expect(getRefreshToken()).toBe('current-refresh')
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })
})
