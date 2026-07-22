import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { reexpresarMonto, valuarDeudaTenant, type InflacionSubsystem } from "@/lib/inflacion"
import { z } from "zod"

/**
 * POST /api/inflacion/reexpresar
 *
 * body:
 *  - modo: "raw" | "tenant"
 *  - raw: { montoOriginal, fechaOrigen, fechaValuacion?, indiceCodigo?, tope? }
 *  - tenant: { subsystem, montoOriginal, fechaOrigen }
 */
const schema = z.object({
  modo: z.enum(["raw", "tenant"]).default("tenant"),
  montoOriginal: z.number(),
  fechaOrigen: z.string(),
  fechaValuacion: z.string().optional(),
  indiceCodigo: z.enum(["IPC_NACIONAL", "IPC_GBA", "UVA", "MANUAL"]).optional(),
  topeVariacionPeriodo: z.number().nullable().optional(),
  subsystem: z
    .enum(["fiado", "cxc", "cxp", "listas_precio", "presupuestos", "custom", "billing_claver"])
    .optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data

  if (d.modo === "raw") {
    const r = reexpresarMonto({
      montoOriginal: d.montoOriginal,
      fechaOrigen: d.fechaOrigen,
      fechaValuacion: d.fechaValuacion,
      indiceCodigo: d.indiceCodigo,
      topeVariacionPeriodo: d.topeVariacionPeriodo,
    })
    return NextResponse.json({ success: true, reexpresion: r })
  }

  const subsystem = (d.subsystem || "fiado") as InflacionSubsystem
  if (subsystem === "billing_claver") {
    return NextResponse.json(
      { error: "billing_claver es de plataforma; usá GET /api/inflacion/billing-preview" },
      { status: 400 },
    )
  }

  const v = valuarDeudaTenant({
    empresaId: ctx.auth.empresaId,
    subsystem,
    montoOriginal: d.montoOriginal,
    fechaOrigen: d.fechaOrigen,
    fechaValuacion: d.fechaValuacion ? new Date(d.fechaValuacion) : undefined,
  })

  return NextResponse.json({ success: true, valuacion: v })
}
