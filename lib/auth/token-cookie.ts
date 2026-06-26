/** Cookie legible por middleware para rutas SSR (/claver-cloud). */
export const AUTH_TOKEN_COOKIE = "clavis_token"

export function setAuthTokenCookie(token: string) {
  if (typeof document === "undefined") return
  const maxAge = 60 * 60 * 24 * 7
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function clearAuthTokenCookie() {
  if (typeof document === "undefined") return
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}