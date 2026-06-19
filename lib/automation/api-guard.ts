import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { requireAutomationEntitlement } from "@/lib/platform/entitlements"

const ADMIN_ROLES = new Set(["admin", "administrador", "gerente", "dueno"])

export async function requireAutomationAdmin(
  request: NextRequest
): Promise<
  | { ok: true; auth: { userId: number; email: string; rol: string; empresaId: number } }
  | { ok: false; response: NextResponse }
> {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return { ok: false, response: ctx.response }

  if (!ADMIN_ROLES.has(ctx.auth.rol)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sin permisos para automatización" }, { status: 403 }),
    }
  }

  const access = await requireAutomationEntitlement(ctx.auth.empresaId)
  if (!access.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Módulo de automatización no contratado", reason: access.reason },
        { status: 402 }
      ),
    }
  }

  return { ok: true, auth: ctx.auth }
}