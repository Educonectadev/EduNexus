import { create } from 'zustand'
import { User, UserRole } from '@/types'

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
  logout: () => set({ user: null, role: null, institutionId: null }),
}))
