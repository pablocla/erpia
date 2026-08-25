"use client"

import { parseJwtPayload } from "@/lib/auth/session-client"
import { useAuthStore, type AuthUser } from "@/lib/stores/auth-store"
import { setAuthTokenCookie } from "@/lib/auth/token-cookie"
import { CLAVER_OWNER_EMAIL } from "@/lib/brand"

export const PREVIEW_HOME_KEY = "claver_preview_home"

export type PreviewHomeSnapshot = {
  token: string
  user: AuthUser
  href: string
}

export function readPreviewHome(): PreviewHomeSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(PREVIEW_HOME_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PreviewHomeSnapshot
    if (!parsed?.token || !parsed?.user) return null
    return parsed
  } catch {
    return null
  }
}

export function clearPreviewHome() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(PREVIEW_HOME_KEY)
}

export function hasPreviewHome(): boolean {
  return readPreviewHome() != null
}

export function peekPreviewMeta(token?: string | null): {
  kind?: string
  label?: string
} | null {
  const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("token") : null)
  if (!t) return null
  const payload = parseJwtPayload(t)
  if (!payload) return null
  if (payload.impersonating === true && payload.previewKind) {
    return {
      kind: String(payload.previewKind),
      label: typeof payload.previewLabel === "string" ? payload.previewLabel : undefined,
    }
  }
  return null
}

/**
 * Guarda la sesión actual una sola vez, para poder volver al admin.
 * Si ya hay una impersonación Cloud, usa esa (no la sesión de tenant).
 */
export function stashPreviewHomeIfNeeded(href?: string) {
  if (typeof window === "undefined") return
  if (sessionStorage.getItem(PREVIEW_HOME_KEY)) return

  const analystToken = sessionStorage.getItem("claver_analyst_token")
  const analystUserRaw = sessionStorage.getItem("claver_analyst_user")
  if (analystToken && analystUserRaw) {
    try {
      const user = JSON.parse(analystUserRaw) as AuthUser
      sessionStorage.setItem(
        PREVIEW_HOME_KEY,
        JSON.stringify({
          token: analystToken,
          user,
          href: "/claver-cloud",
        } satisfies PreviewHomeSnapshot),
      )
      return
    } catch {
      /* fall through */
    }
  }

  const token = useAuthStore.getState().token ?? localStorage.getItem("token")
  const user = useAuthStore.getState().user
  if (!token || !user) return

  const fallbackHref =
    user.email?.trim().toLowerCase() === CLAVER_OWNER_EMAIL.toLowerCase() ||
    user.rol === "analista_claver"
      ? "/claver-cloud"
      : "/dashboard"
  sessionStorage.setItem(
    PREVIEW_HOME_KEY,
    JSON.stringify({
      token,
      user,
      href: href || window.location.pathname || fallbackHref,
    } satisfies PreviewHomeSnapshot),
  )
}

export function applySessionAndGo(token: string, user: AuthUser, href: string) {
  useAuthStore.getState().login(token, {
    ...user,
    id: String(user.id),
  })
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token)
    setAuthTokenCookie(token)
    window.location.assign(href)
  }
}

export function restorePreviewHome(): boolean {
  const snap = readPreviewHome()
  if (!snap) return false
  clearPreviewHome()
  applySessionAndGo(snap.token, snap.user, snap.href || "/claver-cloud")
  return true
}
