import { type NextRequest, NextResponse } from "next/server"

/**
 * Autorización de crons (Vercel Cron / scheduler).
 *
 * Production: SOLO Authorization: Bearer $CRON_SECRET
 *             (rechaza ?secret= para no filtrar en logs/CDN)
 * Dev: Bearer o ?secret= si CRON_SECRET está seteado; sin secret permite non-prod.
 */
export function authorizeCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  const isProd = process.env.NODE_ENV === "production"
  const auth = request.headers.get("authorization")
  const bearerOk = Boolean(secret && auth === `Bearer ${secret}`)
  const querySecret = request.nextUrl.searchParams.get("secret")
  const queryOk = Boolean(secret && querySecret === secret)

  // Vercel Cron envía Authorization: Bearer <CRON_SECRET> si está configurado en vercel.json
  const vercelCron = request.headers.get("user-agent")?.includes("vercel-cron")

  if (isProd) {
    if (!secret) return false
    // Query string prohibido en prod
    if (querySecret != null) return false
    if (bearerOk) return true
    // UA solo no basta sin secret match — si Vercel manda Bearer, bearerOk cubre
    return false
  }

  // Non-production
  if (!secret) return true
  if (bearerOk || queryOk) return true
  // Dev con secret seteado: no abrir de par en par (evita sorpresas)
  if (vercelCron && bearerOk) return true
  return bearerOk || queryOk
}

export function cronUnauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

/** Convenience: null si OK, NextResponse 401 si no. */
export function requireCronAuth(request: NextRequest): NextResponse | null {
  if (authorizeCronRequest(request)) return null
  return cronUnauthorizedResponse()
}
