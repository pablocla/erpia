import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as waveService from "@/lib/wms/wave-service"
import { z } from "zod"

const createSchema = z.object({
  action: z.enum(["crear", "liberar"]).default("crear"),
  depositoId: z.number().int().positive().optional(),
  olaId: z.number().int().positive().optional(),
  criterio: z.string().optional(),
  carrier: z.string().optional(),
  cutoffAt: z.string().optional().nullable(),
  notas: z.string().optional(),
  pedidoVentaIds: z.array(z.number().int().positive()).optional(),
  listaPickingIds: z.array(z.number().int().positive()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const estado = request.nextUrl.searchParams.get("estado") ?? undefined
    const data = await waveService.listarOlas(ctx.auth.empresaId, estado)
    return NextResponse.json(data)
  } catch (error) {
    logError("api/wms/waves:GET", error, request)
    return NextResponse.json({ error: "Error al listar olas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }
    const d = parsed.data

    if (d.action === "liberar") {
      if (!d.olaId) return NextResponse.json({ error: "olaId requerido" }, { status: 400 })
      const ola = await waveService.liberarOla(ctx.auth.empresaId, d.olaId)
      return NextResponse.json(ola)
    }

    if (!d.depositoId) {
      return NextResponse.json({ error: "depositoId requerido" }, { status: 400 })
    }
    const ola = await waveService.crearOla({
      empresaId: ctx.auth.empresaId,
      depositoId: d.depositoId,
      criterio: d.criterio,
      carrier: d.carrier,
      cutoffAt: d.cutoffAt,
      notas: d.notas,
      pedidoVentaIds: d.pedidoVentaIds,
      listaPickingIds: d.listaPickingIds,
    })
    return NextResponse.json(ola, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error"
    if (["DEPOSITO_NO_ENCONTRADO", "OLA_NO_ENCONTRADA", "OLA_CANCELADA", "PEDIDO_NO_ENCONTRADO"].includes(msg)) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    logError("api/wms/waves:POST", error, request)
    return NextResponse.json({ error: "Error en olas de picking" }, { status: 500 })
  }
}
