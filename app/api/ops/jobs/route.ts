import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canAccessClientOps } from "@/lib/auth/claver-analyst"
import { crearOpsJob } from "@/lib/ops/ops-service"
import type { OpsJobTipo } from "@/lib/ops/ops-types"

const schema = z.object({
  tipo: z.enum(["backup_db", "migrate_db", "restart_app", "deploy", "healthcheck", "test_suite"]),
  entornoId: z.number().optional(),
  detalle: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!canAccessClientOps(ctx.auth.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const job = await crearOpsJob({
      empresaId: ctx.auth.empresaId,
      entornoId: parsed.data.entornoId,
      tipo: parsed.data.tipo as OpsJobTipo,
      iniciadoPor: ctx.auth.email,
      detalle: parsed.data.detalle,
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error("Error crear ops job:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}