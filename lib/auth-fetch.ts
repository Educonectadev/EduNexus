import { getAuthToken } from '@/stores/auth-store'

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const token = getAuthToken()
  const headers = new Headers(init?.headers)
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(input, { ...init, headers })
}
