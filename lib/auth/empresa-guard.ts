/**
 * Multi-tenant empresaId guard — Sprint 15
 * Centralized helper for enforcing empresaId isolation in all API routes.
 * Every authenticated route MUST call getEmpresaId() or verificarPropietario().
 */
import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "./middleware"

export interface AuthContext {
  userId: number
  email: string
  rol: string
  empresaId: number
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
