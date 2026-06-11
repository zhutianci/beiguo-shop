import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clearToken } from '@/lib/auth-token'

interface User {
  id: number
  email: string | null
  phone: string | null
  nickname: string | null
  avatar: string | null
  role: string
}

interface UserState {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null })
        clearToken()
        fetch('/api/auth/logout', { method: 'POST' })
      },
    }),
    {
      name: 'user-storage',
    }
  )
)
