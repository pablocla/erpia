import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as packingService from "@/lib/wms/packing-service"
import { z } from "zod"

const schema = z.object({
  action: z.enum(["crear", "actualizar", "cerrar"]),
  pedidoVentaId: z.number().int().positive().optional(),
  packingListId: z.number().int().positive().optional(),
  listaPickingId: z.number().int().positive().optional(),
  depositoId: z.number().int().positive().optional(),
  bultos: z.number().int().positive().optional(),
  pesoKg: z.number().optional(),
  dimensiones: z.string().optional(),
  carrierId: z.string().optional(),
  tracking: z.string().optional(),
  etiquetaUrl: z.string().optional(),
  bultosDetalle: z
    .array(
      z.object({
        numero: z.number().int().positive(),
        pesoKg: z.number().optional(),
        largoCm: z.number().optional(),
        anchoCm: z.number().optional(),
        altoCm: z.number().optional(),
        etiquetaUrl: z.string().optional(),
        tracking: z.string().optional(),
      }),
    )
    .optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const estado = request.nextUrl.searchParams.get("estado") ?? undefined
    const data = await packingService.listarPacking(ctx.auth.empresaId, estado)
    return NextResponse.json(data)
  } catch (error) {
    logError("api/wms/packing:GET", error, request)
    return NextResponse.json({ error: "Error al listar packing" }, { status: 500 })
  }
}

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

    if (d.action === "crear") {
      if (!d.pedidoVentaId) {
        return NextResponse.json({ error: "pedidoVentaId requerido" }, { status: 400 })
      }
      const pl = await packingService.crearPackingDesdePedido(ctx.auth.empresaId, d.pedidoVentaId, {
        listaPickingId: d.listaPickingId,
        depositoId: d.depositoId,
      })
      return NextResponse.json(pl, { status: 201 })
    }

    if (!d.packingListId) {
      return NextResponse.json({ error: "packingListId requerido" }, { status: 400 })
    }

    if (d.action === "cerrar") {
      const pl = await packingService.cerrarPacking(ctx.auth.empresaId, d.packingListId)
      return NextResponse.json(pl)
    }

    const pl = await packingService.actualizarBultos(ctx.auth.empresaId, d.packingListId, d)
    return NextResponse.json(pl)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error"
    if (["PEDIDO_NO_ENCONTRADO", "PACKING_NO_ENCONTRADO"].includes(msg)) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    logError("api/wms/packing:POST", error, request)
    return NextResponse.json({ error: "Error en packing" }, { status: 500 })
  }
}
