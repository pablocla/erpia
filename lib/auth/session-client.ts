import { clearAuthTokenCookie } from "@/lib/auth/token-cookie"
import { isImpersonationPayload } from "@/lib/auth/impersonation"
import { useAuthStore } from "@/lib/stores/auth-store"

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1]
    if (!part) return null
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>
  } catch {
    return null
  }
}

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null
  return useAuthStore.getState().token ?? localStorage.getItem("token")
}

export function isImpersonatingSession(token?: string | null): boolean {
  const t = token ?? getSessionToken()
  if (!t) return false
  const payload = parseJwtPayload(t)
  return payload ? isImpersonationPayload(payload) : false
}

/** Limpia sesión local completa (store, localStorage, cookies, flags Cloud). */
export function clearClientSession(): void {
  useAuthStore.getState().logout()
  if (typeof window === "undefined") return
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  sessionStorage.removeItem("claver-cloud-verified")
  sessionStorage.removeItem("claver_analyst_token")
  sessionStorage.removeItem("claver_analyst_user")
  clearAuthTokenCookie()
}

/** Cierra sesión y navega (hard redirect para evitar estado stale). */
export function performLogoutAndRedirect(redirectTo = "/login"): void {
  clearClientSession()
  if (typeof window !== "undefined") {
    window.location.assign(redirectTo)
  }
}