import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  email: string
  apikey: string
  domains?: any[]
}

interface AuthState {
  user: User | null
  apiKey: string | null
  isAuthenticated: boolean
  setAuth: (user: User, apiKey: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      apiKey: null,
      isAuthenticated: false,
      setAuth: (user, apiKey) => {
        localStorage.setItem('apiKey', apiKey)
        set({ user, apiKey, isAuthenticated: true })
      },
      logout: () => {
        localStorage.removeItem('apiKey')
        set({ user: null, apiKey: null, isAuthenticated: false })
      },
    }),
    {
      name: 'auth-storage',
      // Ensure apiKey in localStorage matches the store
      onRehydrateStorage: () => (state) => {
        if (state) {
          const storedApiKey = localStorage.getItem('apiKey')
          if (storedApiKey && state.apiKey !== storedApiKey) {
            state.apiKey = storedApiKey
          }
          // Update isAuthenticated based on apiKey presence
          state.isAuthenticated = !!state.apiKey && !!state.user
        }
      },
    }
  )
)
