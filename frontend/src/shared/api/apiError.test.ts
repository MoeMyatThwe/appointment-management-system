import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from './apiError'

function apiError(status?: number, data?: unknown, withoutResponse = false) {
  return Object.assign(new Error('request failed'), {
    isAxiosError: true,
    response: withoutResponse ? undefined : { status, data },
  })
}

describe('getApiErrorMessage', () => {
  it('explains invalid login credentials', () => {
    expect(getApiErrorMessage(apiError(401), 'login'))
      .toContain('email or password is incorrect')
  })

  it('explains authorization failures without technical details', () => {
    expect(getApiErrorMessage(apiError(403)))
      .toBe('You do not have permission to do that. Ask your workspace owner or manager for access.')
  })

  it('preserves a useful server conflict message', () => {
    expect(getApiErrorMessage(apiError(409, { message: 'That time is no longer available.' })))
      .toBe('That time is no longer available.')
  })

  it('maps validation failures to actionable guidance', () => {
    expect(getApiErrorMessage(apiError(422), 'general'))
      .toBe('Some details need attention. Check the highlighted fields and try again.')
  })

  it('handles unavailable services clearly', () => {
    expect(getApiErrorMessage(apiError(503)))
      .toBe('The service is temporarily unavailable. Please try again in a moment.')
  })

  it('handles network failures clearly', () => {
    expect(getApiErrorMessage(apiError(undefined, undefined, true)))
      .toContain('could not reach the service')
  })

  it('uses the registration-specific message for bad input', () => {
    expect(getApiErrorMessage(apiError(400), 'register'))
      .toContain('registration details are invalid')
  })

  it('handles unknown errors with a safe fallback', () => {
    expect(getApiErrorMessage({ unexpected: true }))
      .toBe('Something went wrong. Please try again.')
  })
})
