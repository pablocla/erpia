import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as pickWmsService from "@/lib/wms/pick-service"
import * as putawayService from "@/lib/wms/putaway-service"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  action: z.enum(["siguiente_tarea", "pick_scan", "putaway_scan"]),
  depositoId: z.number().int().positive().optional(),
  tipo: z.enum(["pick", "putaway", "move", "count", "replenish"]).optional(),
  tareaId: z.number().int().positive().optional(),
  codigoUbicacion: z.string().optional(),
  codigoProducto: z.string().optional(),
  cantidad: z.number().positive().optional(),
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

    if (d.action === "siguiente_tarea") {
      const tarea = await prisma.tareaWms.findFirst({
        where: {
          empresaId,
          estado: { in: ["pendiente", "asignada", "en_proceso"] },
          ...(d.depositoId ? { depositoId: d.depositoId } : {}),
          ...(d.tipo ? { tipo: d.tipo } : {}),
        },
        orderBy: [{ prioridad: "desc" }, { ordenPath: "asc" }, { createdAt: "asc" }],
        include: {
          producto: { select: { id: true, codigo: true, nombre: true, codigoBarras: true } },
          fromUbicacion: { select: { id: true, codigo: true } },
          toUbicacion: { select: { id: true, codigo: true } },
          lote: { select: { numeroLote: true, fechaVencimiento: true } },
        },
      })
      return NextResponse.json({ tarea })
    }

    if (d.action === "pick_scan") {
      if (!d.tareaId || !d.codigoUbicacion || !d.codigoProducto || !d.cantidad) {
        return NextResponse.json({ error: "tareaId, códigos y cantidad requeridos" }, { status: 400 })
      }
      const result = await pickWmsService.rfPickScan({
        empresaId,
        tareaId: d.tareaId,
        codigoUbicacion: d.codigoUbicacion,
        codigoProducto: d.codigoProducto,
        cantidad: d.cantidad,
        operarioNombre: d.operarioNombre,
        createdBy: ctx.auth.userId,
      })
      return NextResponse.json(result)
    }

    // putaway_scan
    if (!d.tareaId || !d.cantidad) {
      return NextResponse.json({ error: "tareaId y cantidad requeridos" }, { status: 400 })
    }
    let toUbicacionId: number | undefined
    if (d.codigoUbicacion) {
      const tarea = await prisma.tareaWms.findFirst({
        where: { id: d.tareaId, empresaId },
      })
      if (!tarea) return NextResponse.json({ error: "TAREA_NO_ENCONTRADA" }, { status: 404 })
      const ubi = await prisma.ubicacionAlmacen.findFirst({
        where: {
          empresaId,
          depositoId: tarea.depositoId,
          codigo: d.codigoUbicacion.trim().toUpperCase(),
        },
      })
      if (!ubi) return NextResponse.json({ error: "UBICACION_NO_ENCONTRADA" }, { status: 400 })
      toUbicacionId = ubi.id
    }
    const done = await putawayService.completarPutaway({
      empresaId,
      tareaId: d.tareaId,
      cantidad: d.cantidad,
      toUbicacionId,
      operarioNombre: d.operarioNombre,
      createdBy: ctx.auth.userId,
    })
    return NextResponse.json(done)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error"
    if (
      [
        "TAREA_NO_ENCONTRADA",
        "TAREA_YA_COMPLETADA",
        "UBICACION_INCORRECTA",
        "PRODUCTO_INCORRECTO",
        "STOCK_UBICACION_INSUFICIENTE",
        "TAREA_INCOMPLETA",
      ].includes(msg)
    ) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    logError("api/wms/rf:POST", error, request)
    return NextResponse.json({ error: "Error RF WMS" }, { status: 500 })
  }
}
