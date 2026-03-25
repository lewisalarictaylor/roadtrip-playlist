import { create } from 'zustand'

interface User { id: string; display_name: string }

interface AuthStore {
  user: User | null
  loading: boolean
  fetchMe: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  async fetchMe() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) set({ user: await res.json(), loading: false })
      else        set({ user: null, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  async logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    set({ user: null })
  },
}))
