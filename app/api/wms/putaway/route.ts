import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as putawayService from "@/lib/wms/putaway-service"
import { z } from "zod"

const schema = z.object({
  action: z.enum(["sugerir", "crear", "completar"]),
  depositoId: z.number().int().positive().optional(),
  productoId: z.number().int().positive().optional(),
  cantidad: z.number().positive().optional(),
  loteId: z.number().int().positive().optional().nullable(),
  toUbicacionId: z.number().int().positive().optional().nullable(),
  tareaId: z.number().int().positive().optional(),
  asnId: z.number().int().positive().optional().nullable(),
  operarioNombre: z.string().optional(),
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
    const empresaId = ctx.auth.empresaId

    if (d.action === "sugerir") {
      if (!d.depositoId || !d.productoId) {
        return NextResponse.json({ error: "depositoId y productoId requeridos" }, { status: 400 })
      }
      const bin = await putawayService.sugerirBinPutaway(empresaId, d.depositoId, d.productoId)
      return NextResponse.json({ ubicacion: bin })
    }

    if (d.action === "crear") {
      if (!d.depositoId || !d.productoId || !d.cantidad) {
        return NextResponse.json({ error: "depositoId, productoId y cantidad requeridos" }, { status: 400 })
      }
      const tarea = await putawayService.crearTareaPutaway({
        empresaId,
        depositoId: d.depositoId,
        productoId: d.productoId,
        cantidad: d.cantidad,
        loteId: d.loteId,
        toUbicacionId: d.toUbicacionId,
        asnId: d.asnId,
        createdBy: ctx.auth.userId,
      })
      return NextResponse.json(tarea, { status: 201 })
    }

    if (!d.tareaId) {
      return NextResponse.json({ error: "tareaId requerido" }, { status: 400 })
    }
    const done = await putawayService.completarPutaway({
      empresaId,
      tareaId: d.tareaId,
      cantidad: d.cantidad,
      toUbicacionId: d.toUbicacionId ?? undefined,
      operarioNombre: d.operarioNombre,
      createdBy: ctx.auth.userId,
    })
    return NextResponse.json(done)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error"
    if (
      [
        "PRODUCTO_NO_ENCONTRADO",
        "SIN_UBICACION_PUTAWAY",
        "TAREA_NO_ENCONTRADA",
        "TAREA_YA_COMPLETADA",
        "SIN_UBICACION_DESTINO",
        "CANTIDAD_INVALIDA",
      ].includes(msg)
    ) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    logError("api/wms/putaway:POST", error, request)
    return NextResponse.json({ error: "Error en putaway" }, { status: 500 })
  }
}
