import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

// ─── Public routes that skip auth ─────────────────────────────────────────────
const RUTAS_PUBLICAS = ["/api/auth/login", "/api/auth/demo", "/api/auth/refresh", "/api/ecommerce"]

// Encode the secret once at module level
function getSecret() {
  const raw = process.env.JWT_SECRET
  if (!raw && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET no configurado en producción")
  }
  // In dev with random per-process secret from auth-service, middleware can't validate.
  // We accept the token if JWT_SECRET is not set in dev (auth-service uses its own, validated later).
  return raw ? new TextEncoder().encode(raw) : null
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ─── Public routes ────────────────────────────────────────────────────────
  if (RUTAS_PUBLICAS.some((ruta) => pathname.startsWith(ruta))) {
    return NextResponse.next()
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

      return addRequestId(
        NextResponse.next({ request: { headers } }),
        request,
      )
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
  matcher: ["/api/:path*"],
}
