import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { crearOpsJob } from "@/lib/ops/ops-service"
import type { OpsJobTipo } from "@/lib/ops/ops-types"

const schema = z.object({
  tipo: z.enum(["backup_db", "migrate_db", "restart_app", "deploy", "healthcheck", "test_suite"]),
  entornoId: z.number().optional(),
  detalle: z.record(z.unknown()).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId: raw } = await params
    const empresaId = Number(raw)
    const ctx = await getClaverAnalystEmpresaContext(request, empresaId)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const job = await crearOpsJob({
      empresaId,
      entornoId: parsed.data.entornoId,
      tipo: parsed.data.tipo as OpsJobTipo,
      iniciadoPor: `[CLAVER] ${ctx.auth.email}`,
      detalle: parsed.data.detalle,
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error("Error job ops analista:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}