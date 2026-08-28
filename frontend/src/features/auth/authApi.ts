import { httpClient } from '../../shared/api/httpClient'
import type { CurrentUser, LoginResponse, WorkspaceProfile } from './types'

interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  workspaceName: string
  email: string
  password: string
}

export async function login(payload: LoginRequest) {
  const { data } = await httpClient.post<LoginResponse>('/auth/login', payload)
  return data
}

export async function register(payload: RegisterRequest) {
  const { data } = await httpClient.post<LoginResponse>('/auth/register', payload)
  return data
}

export async function fetchCurrentUser() {
  const { data } = await httpClient.get<CurrentUser>('/auth/me')
  return data
}

export async function fetchWorkspaceProfile() {
  const { data } = await httpClient.get<WorkspaceProfile>('/auth/workspace')
  return data
}

export async function updateWorkspaceProfile(profile: WorkspaceProfile) {
  const { data } = await httpClient.put<WorkspaceProfile>('/auth/workspace', profile)
  return data
}

export async function logout(refreshToken?: string) {
  if (!refreshToken) {
    return
  }
  await httpClient.post('/auth/logout', { refreshToken })
}
