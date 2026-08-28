import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { clearAuthTokenCookie, setAuthTokenCookie } from "@/lib/auth/token-cookie"

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
  /** Pack UX: fiado | prestamista | pos | … */
  empresaModoLite?: string
  avatarUrl?: string | null
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
          const prevUserStr = localStorage.getItem("user")
          try {
            if (prevUserStr) {
              const prevUser = JSON.parse(prevUserStr)
              if (prevUser.empresaId !== user.empresaId || prevUser.id !== user.id) {
                // Tenant changed — wipe tenant-sensitive local caches to prevent cross-tenant leakage
                localStorage.removeItem("caja-pos-storage")
                localStorage.removeItem("erp:pos:draft:v1")
                Object.keys(localStorage).forEach((key) => {
                  if (key.startsWith("erp:pos:draft:") || key.startsWith("pos_")) {
                    localStorage.removeItem(key)
                  }
                })
              }
            }
          } catch { /* ignore */ }

          localStorage.setItem("token", token)
          localStorage.setItem("user", JSON.stringify(user))
          setAuthTokenCookie(token)
        }
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        if (typeof window !== "undefined") {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          localStorage.removeItem("erp-auth")
          localStorage.removeItem("caja-pos-storage")
          localStorage.removeItem("erp:pos:draft:v1")
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("erp:pos:draft:") || key.startsWith("pos_")) {
              localStorage.removeItem(key)
            }
          })
          sessionStorage.removeItem("claver-cloud-verified")
          sessionStorage.removeItem("claver_analyst_token")
          sessionStorage.removeItem("claver_analyst_user")
          sessionStorage.removeItem("claver_preview_home")
          clearAuthTokenCookie()
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
      /**
       * Si loginConToken corre antes de que termine la rehidratación,
       * no pisar la sesión fresca con el snapshot viejo de localStorage.
       */
      merge: (persistedState, currentState) => {
        const p = (persistedState ?? {}) as Partial<AuthState>
        if (currentState.token && currentState.isAuthenticated) {
          return {
            ...currentState,
            isHydrated: true,
          }
        }
        return {
          ...currentState,
          ...p,
          isHydrated: true,
        }
      },
      onRehydrateStorage: () => (state, _error) => {
        if (state?.token && typeof window !== "undefined") {
          setAuthTokenCookie(state.token)
          // Mantener legacy key alineada con el store
          localStorage.setItem("token", state.token)
        }
        if (state) {
          state.setHydrated()
        } else {
          // Rehidratación fallida o sin snapshot: igual marcar listo para no colgar el dashboard
          useAuthStore.setState({ isHydrated: true })
        }
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
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(url, { ...options, headers })

  // Auto-logout on sesión inválida (middleware usa 401 o 403 + code)
  if (response.status === 401 || response.status === 403) {
    const data = await response.clone().json().catch(() => ({}))
    if (data.code === "TOKEN_EXPIRED" || data.code === "TOKEN_INVALID") {
      useAuthStore.getState().logout()
    }
  }

  return response
}
