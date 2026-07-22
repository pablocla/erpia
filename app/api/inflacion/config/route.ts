import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canManageUsers } from "@/lib/auth/admin-roles"
import {
  getPlatformBillingPolicy,
  listTenantPolicies,
  setTenantPolicy,
  type InflacionSubsystem,
} from "@/lib/inflacion"
import { z } from "zod"

/**
 * GET  /api/inflacion/config — policies platform (read) + tenant
 * PATCH /api/inflacion/config — update tenant policy
 */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  return NextResponse.json({
    success: true,
    platform: {
      billing_claver: getPlatformBillingPolicy(),
      env: {
        CLAVER_INDEXAR_PRECIOS: process.env.CLAVER_INDEXAR_PRECIOS ?? "0",
        CLAVER_PRECIO_BASE_PERIODO: process.env.CLAVER_PRECIO_BASE_PERIODO ?? "2026-01",
      },
    },
    tenant: listTenantPolicies(ctx.auth.empresaId),
  })
}

const patchSchema = z.object({
  subsystem: z.enum(["fiado", "cxc", "cxp", "listas_precio", "presupuestos", "custom"]),
  activo: z.boolean().optional(),
  soloInformativo: z.boolean().optional(),
  indiceCodigo: z.enum(["IPC_NACIONAL", "IPC_GBA", "UVA", "MANUAL"]).optional(),
  topeVariacionPeriodo: z.number().nullable().optional(),
  diasGraciaNominal: z.number().int().min(0).max(31).optional(),
  diaPublicacion: z.number().int().min(1).max(28).optional(),
  notas: z.string().optional(),
})

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response
  if (!canManageUsers(ctx.auth.rol)) {
    return NextResponse.json({ error: "Solo administradores de la empresa" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
  }

  const { subsystem, ...patch } = parsed.data
  const policy = setTenantPolicy(ctx.auth.empresaId, subsystem as InflacionSubsystem, patch)
  return NextResponse.json({ success: true, policy })
}
