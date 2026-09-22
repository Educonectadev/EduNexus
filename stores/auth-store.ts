import { create } from 'zustand'
import { User, UserRole } from '@/types'

const TOKEN_KEY = 'edu_token'

export function getAuthToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function setAuthToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token) } catch {}
}

export function clearAuthToken() {
  try { localStorage.removeItem(TOKEN_KEY) } catch {}
}

interface AuthState {
  user: User | null
  role: UserRole | null
  institutionId: string | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setRole: (role: UserRole | null) => void
  setInstitutionId: (id: string | null) => void
  setIsLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  institutionId: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setInstitutionId: (institutionId) => set({ institutionId }),
  setIsLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    clearAuthToken()
    set({ user: null, role: null, institutionId: null })
  },
}))
