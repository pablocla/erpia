/**
 * Multi-tenant empresaId guard — Sprint 15
 * Centralized helper for enforcing empresaId isolation in all API routes.
 * Every authenticated route MUST call getEmpresaId() or verificarPropietario().
 */
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { logError } from "@/lib/monitoring/error-logger"
import { verificarToken } from "./middleware"

export interface AuthContext {
  userId: number
  email: string
  rol: string
  empresaId: number
}

/** Alias compatible con planes de wrapper multi-tenant */
export type AuthenticatedContext = AuthContext

export type RouteContext<P extends Record<string, string> = Record<string, string>> = {
  params?: Promise<P>
}

export type AuthedRouteHandler<P extends Record<string, string> = Record<string, string>> = (
  req: NextRequest,
  auth: AuthContext,
  ctx: RouteContext<P>,
) => Promise<NextResponse> | NextResponse

export type WithAuthOptions = {
  /** Si se define, rechaza roles fuera de la lista */
  roles?: string[]
}

/**
 * Extract and validate empresaId from JWT token.
 * Returns the full auth context or a 401 response.
 */
export async function getAuthContext(
  request: NextRequest
): Promise<{ ok: true; auth: AuthContext } | { ok: false; response: NextResponse }> {
  const usuario = await verificarToken(request)
  if (!usuario) {
    return { ok: false, response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  }
  if (!usuario.empresaId) {
    return { ok: false, response: NextResponse.json({ error: "Token sin empresaId" }, { status: 403 }) }
  }
  return {
    ok: true,
    auth: {
      userId: usuario.userId,
      email: usuario.email,
      rol: usuario.rol,
      empresaId: usuario.empresaId,
    },
  }
}

/**
 * Prisma where clause helper — adds empresaId filter to any existing where.
 */
export function whereEmpresa(empresaId: number, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...extra, empresaId }
}

/**
 * Verify that a fetched record belongs to the authenticated user's empresa.
 * Use after findUnique/findFirst when the query can't filter by empresaId directly.
 */
export function verificarPropietario(
  record: { empresaId?: number | null } | null,
  empresaId: number
): boolean {
  if (!record) return false
  return record.empresaId === empresaId
}

/**
 * Higher-order wrapper para App Router — valida JWT + empresaId y delega al handler.
 * Usa jose/AuthService (no NextAuth). Ejemplo:
 *
 * export const POST = withAuthAndTenant(async (req, auth) => {
 *   const data = await prisma.cliente.findMany({ where: whereEmpresa(auth.empresaId) })
 *   return NextResponse.json(data)
 * })
 */
export function zodErrorResponse(error: z.ZodError, status = 400) {
  return NextResponse.json(
    { error: "Payload inválido", detalles: error.flatten() },
    { status },
  )
}

export function withAuthAndTenant<P extends Record<string, string> = Record<string, string>>(
  handler: AuthedRouteHandler<P>,
  opts?: WithAuthOptions,
) {
  return async (req: NextRequest, ctx: RouteContext<P> = {}) => {
    try {
      const guard = await getAuthContext(req)
      if (!guard.ok) return guard.response

      if (opts?.roles?.length && !opts.roles.includes(guard.auth.rol)) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
      }

      return await handler(req, guard.auth, ctx)
    } catch (error) {
      console.error("[API_ERROR]", error)
      logError("withAuthAndTenant", error, req)
      return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
    }
  }
}
