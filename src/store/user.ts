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
  // /api/auth/me 本来就会带这两个字段（balance 是 Decimal 序列化出来的字符串）。
  // 只做类型声明、不据此展示：本地持久化的值可能是旧的，余额/等级页面一律现拉接口
  balance?: string | number
  vipLevel?: number
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
