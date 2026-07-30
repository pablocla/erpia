import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as slottingService from "@/lib/wms/slotting-service"
import { z } from "zod"

const schema = z.object({
  action: z.enum(["recalcular_abc", "sugerir", "reponer"]),
  depositoId: z.number().int().positive().optional(),
  dias: z.number().int().positive().optional(),
  productoId: z.number().int().positive().optional(),
  pickUbicacionId: z.number().int().positive().optional(),
  bulkUbicacionId: z.number().int().positive().optional(),
  cantidad: z.number().positive().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }
    const d = parsed.data

    if (d.action === "recalcular_abc") {
      const r = await slottingService.recalcularAbc(ctx.auth.empresaId, d.dias ?? 90)
      return NextResponse.json(r)
    }

    if (d.action === "sugerir") {
      if (!d.depositoId) return NextResponse.json({ error: "depositoId requerido" }, { status: 400 })
      const r = await slottingService.sugerirReubicacionAbc(ctx.auth.empresaId, d.depositoId)
      return NextResponse.json({ sugerencias: r })
    }

    if (
      !d.depositoId ||
      !d.productoId ||
      !d.pickUbicacionId ||
      !d.bulkUbicacionId ||
      !d.cantidad
    ) {
      return NextResponse.json({ error: "Datos de reposición incompletos" }, { status: 400 })
    }
    const r = await slottingService.reponerPickFace({
      empresaId: ctx.auth.empresaId,
      depositoId: d.depositoId,
      productoId: d.productoId,
      pickUbicacionId: d.pickUbicacionId,
      bulkUbicacionId: d.bulkUbicacionId,
      cantidad: d.cantidad,
    })
    return NextResponse.json(r)
  } catch (error) {
    logError("api/wms/slotting:POST", error, request)
    return NextResponse.json({ error: "Error en slotting" }, { status: 500 })
  }
}
