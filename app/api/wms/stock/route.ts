import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as stockUbicacionService from "@/lib/wms/stock-ubicacion-service"
import { z } from "zod"

const adjustSchema = z.object({
  action: z.enum(["ajustar", "mover"]),
  depositoId: z.number().int().positive(),
  productoId: z.number().int().positive(),
  cantidad: z.number(),
  ubicacionId: z.number().int().positive().optional(),
  fromUbicacionId: z.number().int().positive().optional(),
  toUbicacionId: z.number().int().positive().optional(),
  loteId: z.number().int().positive().optional().nullable(),
  motivo: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const sp = request.nextUrl.searchParams
    const data = await stockUbicacionService.listarStockUbicacion(ctx.auth.empresaId, {
      depositoId: sp.get("depositoId") ? Number(sp.get("depositoId")) : undefined,
      productoId: sp.get("productoId") ? Number(sp.get("productoId")) : undefined,
      ubicacionId: sp.get("ubicacionId") ? Number(sp.get("ubicacionId")) : undefined,
    })
    return NextResponse.json(data)
  } catch (error) {
    logError("api/wms/stock:GET", error, request)
    return NextResponse.json({ error: "Error al listar stock por ubicación" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const body = await request.json()
    const parsed = adjustSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }
    const d = parsed.data

    if (d.action === "mover") {
      if (!d.fromUbicacionId || !d.toUbicacionId || d.cantidad <= 0) {
        return NextResponse.json({ error: "from/to y cantidad requeridos" }, { status: 400 })
      }
      const r = await stockUbicacionService.moverEntreUbicaciones({
        empresaId: ctx.auth.empresaId,
        depositoId: d.depositoId,
        fromUbicacionId: d.fromUbicacionId,
        toUbicacionId: d.toUbicacionId,
        productoId: d.productoId,
        loteId: d.loteId,
        cantidad: d.cantidad,
        motivo: d.motivo,
        createdBy: ctx.auth.userId,
      })
      return NextResponse.json(r)
    }

    if (!d.ubicacionId) {
      return NextResponse.json({ error: "ubicacionId requerido" }, { status: 400 })
    }
    const row = await stockUbicacionService.ajustarStockUbicacion({
      empresaId: ctx.auth.empresaId,
      depositoId: d.depositoId,
      ubicacionId: d.ubicacionId,
      productoId: d.productoId,
      loteId: d.loteId,
      cantidadDelta: d.cantidad,
      tipo: "ajuste",
      motivo: d.motivo ?? "Ajuste manual WMS",
      createdBy: ctx.auth.userId,
      syncDeposito: true,
    })
    return NextResponse.json(row)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error"
    if (msg === "STOCK_UBICACION_INSUFICIENTE" || msg === "CANTIDAD_INVALIDA") {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    logError("api/wms/stock:POST", error, request)
    return NextResponse.json({ error: "Error en movimiento de stock" }, { status: 500 })
  }
}
