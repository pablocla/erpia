import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { ventasService } from "@/lib/ventas/ventas-service"
import { z } from "zod"

const lineaPedidoSchema = z.object({
  productoId: z.number().int().positive().optional(),
  descripcion: z.string().min(1),
  cantidad: z.number().positive(),
  precioUnitario: z.number().positive(),
})

const pedidoSchema = z.object({
  clienteId: z.number().int().positive(),
  vendedorId: z.number().int().positive().optional(),
  condicionPagoId: z.number().int().positive().optional(),
  canalVentaId: z.number().int().positive().optional(),
  fechaEntregaEst: z.string().date().optional(),
  observaciones: z.string().optional(),
  lineas: z.array(lineaPedidoSchema).min(1),
})

const actionSchema = z.object({
  action: z.enum(["confirmar", "picking", "remito", "anular", "facturar"]),
  pedidoId: z.number().int().positive(),
  depositoId: z.number().int().positive().optional(),
  // Datos para facturación (solo cuando action=facturar)
  tipo: z.enum(["A", "B", "C"]).optional(),
  tipoCbte: z.number().int().optional(),
  puntoVenta: z.number().int().positive().optional(),
  cae: z.string().optional(),
  condicionPagoId: z.number().int().positive().optional(),
})

// ─── GET — List pedidos de venta ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("clienteId")
    const estado = searchParams.get("estado")
    const page = parseInt(searchParams.get("page") ?? "1", 10)
    const limit = parseInt(searchParams.get("limit") ?? "20", 10)

    const result = await ventasService.listarPedidos({
      empresaId: ctx.auth.empresaId,
      clienteId: clienteId ? parseInt(clienteId, 10) : undefined,
      estado: estado ?? undefined,
      page,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al listar pedidos:", error)
    logError("api/ventas/pedidos:GET", error, request)
    return NextResponse.json({ error: "Error al listar pedidos" }, { status: 500 })
  }
}

// ─── POST — Create pedido OR execute action (confirmar/picking/remito/anular)

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()

    // Check if it's an action on existing pedido
    const actionResult = actionSchema.safeParse(body)
    if (actionResult.success) {
      const { action, pedidoId, depositoId } = actionResult.data
      let result: any
      switch (action) {
        case "confirmar":
          result = await ventasService.confirmarPedido(pedidoId)
          break
        case "picking":
          result = await ventasService.generarListaPicking(pedidoId)
          break
        case "remito":
          result = await ventasService.generarRemito(pedidoId, depositoId)
          break
        case "anular":
          result = await ventasService.anularPedido(pedidoId)
          break
        case "facturar": {
          const tipo = actionResult.data.tipo ?? "B"
          const tipoCbteMap: Record<string, number> = { A: 1, B: 6, C: 11 }
          result = await ventasService.facturarPedido(pedidoId, {
            empresaId: ctx.auth.empresaId,
            tipo,
            tipoCbte: actionResult.data.tipoCbte ?? tipoCbteMap[tipo] ?? 6,
            puntoVenta: actionResult.data.puntoVenta ?? 1,
            cae: actionResult.data.cae,
            condicionPagoId: actionResult.data.condicionPagoId,
          })
          break
        }
      }
      return NextResponse.json(result, { status: 200 })
    }

    // Otherwise, create new pedido
    const validacion = pedidoSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const pedido = await ventasService.crearPedidoVenta({
      ...validacion.data,
      empresaId: ctx.auth.empresaId,
      fechaEntregaEst: validacion.data.fechaEntregaEst
        ? new Date(validacion.data.fechaEntregaEst)
        : undefined,
    })

    return NextResponse.json(pedido, { status: 201 })
  } catch (error: any) {
    console.error("Error en pedido de venta:", error)
    const message = error?.message ?? "Error interno"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
