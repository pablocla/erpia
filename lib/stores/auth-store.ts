import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

/* ═══════════════════════════════════════════════════════════════════════════
   AUTH STORE — Centralized authentication state (Zustand)
   Replaces 40+ scattered localStorage.getItem("token") calls.
   Persists token + user profile to localStorage with hydration safety.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface AuthUser {
  id: string
  email: string
  nombre: string
  rol: string
  empresaId: number
  empresaNombre?: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isHydrated: boolean

  // Actions
  login: (token: string, user: AuthUser) => void
  logout: () => void
  updateUser: (partial: Partial<AuthUser>) => void
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,

      login: (token, user) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token)
        }
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        if (typeof window !== "undefined") {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          localStorage.removeItem("erp-auth")
        }
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "erp-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated()
      },
    },
  ),
)

/** Helper: get token for API calls (works in any component) */
export function getToken(): string | null {
  const stateToken = useAuthStore.getState().token
  if (stateToken) return stateToken

  if (typeof window === "undefined") return null

  const legacyToken = window.localStorage.getItem("token")
  if (legacyToken) return legacyToken

  const persisted = window.localStorage.getItem("erp-auth")
  if (!persisted) return null

  try {
    const parsed = JSON.parse(persisted)
    return typeof parsed?.token === "string" ? parsed.token : null
  } catch {
    return null
  }
}

/** Helper: get auth headers for fetch */
export function getAuthHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** Helper: authenticated fetch wrapper */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set("Authorization", `Bearer ${token}`)
  headers.set("Content-Type", "application/json")

  const response = await fetch(url, { ...options, headers })

  // Auto-logout on 401
  if (response.status === 401) {
    const data = await response.clone().json().catch(() => ({}))
    if (data.code === "TOKEN_EXPIRED" || data.code === "TOKEN_INVALID") {
      useAuthStore.getState().logout()
    }
  }

  return response
}
