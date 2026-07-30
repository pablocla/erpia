import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as pickWmsService from "@/lib/wms/pick-service"
import { z } from "zod"

const schema = z.object({
  action: z.enum(["generar", "confirmar_linea"]),
  pedidoVentaId: z.number().int().positive().optional(),
  depositoId: z.number().int().positive().optional(),
  lineaId: z.number().int().positive().optional(),
  cantidadPicada: z.number().optional(),
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

    if (d.action === "generar") {
      if (!d.pedidoVentaId) {
        return NextResponse.json({ error: "pedidoVentaId requerido" }, { status: 400 })
      }
      const lista = await pickWmsService.generarPickingDirigido(
        ctx.auth.empresaId,
        d.pedidoVentaId,
        d.depositoId,
      )
      return NextResponse.json(lista, { status: 201 })
    }

    if (!d.lineaId || d.cantidadPicada == null) {
      return NextResponse.json({ error: "lineaId y cantidadPicada requeridos" }, { status: 400 })
    }
    const linea = await pickWmsService.confirmarPickLinea({
      empresaId: ctx.auth.empresaId,
      lineaId: d.lineaId,
      cantidadPicada: d.cantidadPicada,
      operarioNombre: d.operarioNombre,
      createdBy: ctx.auth.userId,
    })
    return NextResponse.json(linea)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error"
    if (["PEDIDO_NO_ENCONTRADO", "LINEA_NO_ENCONTRADA", "CANTIDAD_INVALIDA", "STOCK_UBICACION_INSUFICIENTE"].includes(msg)) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    logError("api/wms/pick:POST", error, request)
    return NextResponse.json({ error: "Error en picking WMS" }, { status: 500 })
  }
}
