import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

// ─── Public routes that skip auth ─────────────────────────────────────────────
const RUTAS_PUBLICAS = ["/api/auth/login", "/api/auth/demo", "/api/auth/register", "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/refresh", "/api/ecommerce", "/api/ai/status", "/api/health"]

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
    return addRequestId(NextResponse.next(), request)
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

  return addRequestId(NextResponse.next(), request)
}

/** Attach a request ID for distributed tracing */
function addRequestId(response: NextResponse, request: NextRequest): NextResponse {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID()
  response.headers.set("x-request-id", requestId)
  return response
}

export const config = {
  matcher: [
    // Match all paths except _next/static, _next/image, favicon.ico
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
