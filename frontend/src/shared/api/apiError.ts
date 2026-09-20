import axios from 'axios'

type ErrorContext = 'login' | 'register' | 'recovery' | 'session' | 'general'

function serverMessage(error: unknown) {
  if (!axios.isAxiosError(error)) return null
  const data = error.response?.data
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' && data.message.trim()) {
    return data.message.trim()
  }
  return null
}

export function getApiErrorMessage(error: unknown, context: ErrorContext = 'general') {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined

  if (status === 401) {
    if (context === 'login') return 'The email or password is incorrect. Check your details and try again, or use "Forgot password?".'
    if (context === 'session') return 'Your session has expired. Please sign in again to continue.'
    return 'You are not signed in. Please sign in and try again.'
  }

  if (status === 403) return 'You do not have permission to do that. Ask your workspace owner or manager for access.'
  if (status === 404) return 'We could not find that item. It may have been removed or is no longer available.'
  if (status === 409) return serverMessage(error) ?? 'That change conflicts with existing data. Review the details and try again.'
  if (status === 422) return serverMessage(error) ?? 'Some details need attention. Check the highlighted fields and try again.'
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.'
  if (status && status >= 500) return 'The service is temporarily unavailable. Please try again in a moment.'
  if (axios.isAxiosError(error) && !error.response) return 'We could not reach the service. Check your connection and make sure the application services are running.'

  if (context === 'register' && status === 400) return 'Some registration details are invalid. Check your business name, email, and password.'
  if (context === 'recovery') return serverMessage(error) ?? 'We could not complete account recovery. Check your details and try again.'
  return serverMessage(error) ?? (error instanceof Error ? error.message : 'Something went wrong. Please try again.')
}
