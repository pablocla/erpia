import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext, type AuthContext } from "@/lib/auth/empresa-guard"

export const STAKEHOLDER_ROLE = "stakeholder"

export function isStakeholder(rol?: string): boolean {
  return rol === STAKEHOLDER_ROLE
}

export async function getStakeholderContext(
  request: NextRequest,
): Promise<{ ok: true; auth: AuthContext } | { ok: false; response: NextResponse }> {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx

  if (!isStakeholder(ctx.auth.rol)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acceso restringido al portal de seguimiento del cliente" },
        { status: 403 },
      ),
    }
  }

  return ctx
}