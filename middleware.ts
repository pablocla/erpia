import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { AUTH_TOKEN_COOKIE } from "@/lib/auth/token-cookie"
import {
  LOCALE_COOKIE,
  MARKET_COOKIE,
  MARKET_LOCKED_COOKIE,
  getMarketConfig,
} from "@/lib/comercial/markets"
import {
  localeFromMarketId,
  resolveMarketFromCookiesAndGeo,
} from "@/lib/i18n/geo-market"

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// ─── Public routes that skip auth ─────────────────────────────────────────────
const RUTAS_PUBLICAS = [
  "/api/auth/login",
  "/api/auth/demo",
  "/api/auth/signup",
  "/api/auth/google",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/refresh",
  "/api/ecommerce",
  "/api/ai/onboarding",
  "/api/ai/valor-rubro",
  "/api/health",
  "/api/onboarding",
  "/api/comercial/consultas",
  "/api/comercial/implementacion-arca",
  "/api/webhooks/",
  "/api/webhooks/stripe",
  "/api/cron/",
  "/api/public/",
  "/api/agent-city",
  "/api/analytics/track",
]

// ─── Static asset extensions ──────────────────────────────────────────────────
const STATIC_EXT = /\.(ico|png|jpg|jpeg|svg|webp|avif|woff2?|ttf|css|js|map)$/i

// Encode the secret once at module level
function getSecret() {
  const raw = process.env.JWT_SECRET
  if (!raw && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET no configurado en producción")
  }
  return raw ? new TextEncoder().encode(raw) : null
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ─── Static assets: aggressive cache, skip auth ───────────────────────────
  if (STATIC_EXT.test(pathname) || pathname.startsWith("/_next/")) {
    const response = NextResponse.next()
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable")
    return response
  }

  // ─── Public routes ────────────────────────────────────────────────────────
  if (RUTAS_PUBLICAS.some((ruta) => pathname.startsWith(ruta))) {
    return applyMarketCookies(addRequestId(NextResponse.next(), request), request)
  }

  // ─── Claver Cloud (torre analista) — requiere JWT en cookie ───────────────
  if (pathname.startsWith("/claver-cloud")) {
    const rawCookie = request.cookies.get(AUTH_TOKEN_COOKIE)?.value
    if (!rawCookie) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const token = decodeURIComponent(rawCookie)
    const secret = getSecret()

    if (secret) {
      try {
        await jwtVerify(token, secret)
      } catch {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("next", pathname)
        const response = NextResponse.redirect(loginUrl)
        response.cookies.set(AUTH_TOKEN_COOKIE, "", { path: "/", maxAge: 0 })
        return response
      }
    }

    const response = NextResponse.next()
    response.headers.set("Cache-Control", "no-store, max-age=0")
    return addRequestId(response, request)
  }

  // ─── Protected API routes ─────────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const secret = getSecret()

    // If no JWT_SECRET in env (dev mode with per-process secret), pass through
    // and let route-level verificarToken() handle validation
    if (!secret) {
      return addRequestId(NextResponse.next(), request)
    }

    try {
      const { payload } = await jwtVerify(token, secret)

      // Forward decoded user context to route handlers via headers
      const headers = new Headers(request.headers)
      if (payload.userId) headers.set("x-user-id", String(payload.userId))
      if (payload.email) headers.set("x-user-email", String(payload.email))
      if (payload.rol) headers.set("x-user-rol", String(payload.rol))
      if (payload.empresaId) headers.set("x-empresa-id", String(payload.empresaId))

      const response = NextResponse.next({ request: { headers } })
      // API responses: no-store by default (private, real-time data)
      response.headers.set("Cache-Control", "no-store, max-age=0")
      return addRequestId(response, request)
    } catch (error: any) {
      if (error?.code === "ERR_JWT_EXPIRED") {
        return NextResponse.json(
          { error: "Token expirado", code: "TOKEN_EXPIRED" },
          { status: 401 },
        )
      }
      return NextResponse.json(
        { error: "Token inválido", code: "TOKEN_INVALID" },
        { status: 403 },
      )
    }
  }

  return applyMarketCookies(addRequestId(NextResponse.next(), request), request)
}

/** Attach a request ID for distributed tracing */
function addRequestId(response: NextResponse, request: NextRequest): NextResponse {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID()
  response.headers.set("x-request-id", requestId)
  return response
}

/**
 * Multinational market: detect country from edge IP headers and set
 * CLAVER_MARKET + NEXT_LOCALE when the visitor has not locked a preference.
 * Query overrides: ?market=us|ar|mx|br or ?lang=en|es-AR
 */
function applyMarketCookies(response: NextResponse, request: NextRequest): NextResponse {
  // Skip API auth paths that already returned JSON errors without going through here
  const pathname = request.nextUrl.pathname
  if (pathname.startsWith("/api/")) return response

  const locked = request.cookies.get(MARKET_LOCKED_COOKIE)?.value === "1"
  const queryMarket = request.nextUrl.searchParams.get("market")
  const queryLang =
    request.nextUrl.searchParams.get("lang") ?? request.nextUrl.searchParams.get("locale")

  const resolved = resolveMarketFromCookiesAndGeo({
    marketCookie: request.cookies.get(MARKET_COOKIE)?.value,
    localeCookie: request.cookies.get(LOCALE_COOKIE)?.value,
    marketLocked: request.cookies.get(MARKET_LOCKED_COOKIE)?.value,
    queryMarket,
    queryLang,
    getHeader: (name) => request.headers.get(name),
  })

  // If user locked market/locale, only apply query overrides (explicit switch)
  if (locked && resolved.source !== "query") {
    response.headers.set("x-claver-market", request.cookies.get(MARKET_COOKIE)?.value ?? "ar")
    return response
  }

  const market = getMarketConfig(resolved.marketId)
  const locale = localeFromMarketId(resolved.marketId)

  const needsMarket =
    request.cookies.get(MARKET_COOKIE)?.value !== market.id || resolved.source === "query"
  const needsLocale =
    request.cookies.get(LOCALE_COOKIE)?.value !== locale || resolved.source === "query"

  if (needsMarket) {
    response.cookies.set(MARKET_COOKIE, market.id, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    })
  }
  if (needsLocale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    })
  }
  if (resolved.source === "query") {
    response.cookies.set(MARKET_LOCKED_COOKIE, "1", {
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    })
  }

  response.headers.set("x-claver-market", market.id)
  response.headers.set("x-claver-market-source", resolved.source)
  return response
}

export const config = {
  matcher: [
    // Match all paths except _next/static, _next/image, favicon.ico
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
