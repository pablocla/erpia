import { type NextRequest, NextResponse } from "next/server"
import { withAuthAndTenant, zodErrorResponse } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import { ventasService } from "@/lib/ventas/ventas-service"
import { prisma } from "@/lib/prisma"
import {
  crearPedidoVentaSchema,
  pedidoVentaActionSchema,
} from "@/lib/schemas/ventas"

export const GET = withAuthAndTenant(async (request, auth) => {
  const { searchParams } = new URL(request.url)
  const clienteId = searchParams.get("clienteId")
  const estado = searchParams.get("estado")
  const page = parseInt(searchParams.get("page") ?? "1", 10)
  const limit = parseInt(searchParams.get("limit") ?? "20", 10)

  const result = await ventasService.listarPedidos({
    empresaId: auth.empresaId,
    clienteId: clienteId ? parseInt(clienteId, 10) : undefined,
    estado: estado ?? undefined,
    page,
    limit,
  })

  return NextResponse.json(result)
})

export const POST = withAuthAndTenant(async (request, auth) => {
  const body = await request.json()

  const actionResult = pedidoVentaActionSchema.safeParse(body)
  if (actionResult.success) {
    const { action, pedidoId, depositoId } = actionResult.data
    let result: unknown

    switch (action) {
      case "confirmar":
        result = await ventasService.confirmarPedido(pedidoId, auth.empresaId)
        break
      case "picking":
        result = await ventasService.generarListaPicking(pedidoId, auth.empresaId)
        break
      case "remito":
        result = await ventasService.generarRemito(pedidoId, auth.empresaId, depositoId)
        break
      case "anular":
        result = await ventasService.anularPedido(pedidoId, auth.empresaId)
        break
      case "clonar":
        result = await ventasService.clonarPedido(pedidoId, auth.empresaId)
        break
      case "facturar": {
        const pedidoCtx = await prisma.pedidoVenta.findFirst({
          where: { id: pedidoId, empresaId: auth.empresaId },
          include: { cliente: { select: { condicionIva: true } } },
        })
        const { tipoFacturaSugerido } = await import("@/lib/pos/pos-tipo-factura")
        const tipoLetra = tipoFacturaSugerido(pedidoCtx?.cliente?.condicionIva)
        const tipo = actionResult.data.tipo ?? (tipoLetra === "ticket" ? "B" : tipoLetra)
        const tipoCbteMap: Record<string, number> = { A: 1, B: 6, C: 11 }
        const empresaPv = await prisma.empresa.findUnique({
          where: { id: auth.empresaId },
          select: { puntoVenta: true },
        })
        result = await ventasService.facturarPedido(pedidoId, {
          empresaId: auth.empresaId,
          tipo,
          tipoCbte: actionResult.data.tipoCbte ?? tipoCbteMap[tipo] ?? 6,
          puntoVenta: actionResult.data.puntoVenta ?? empresaPv?.puntoVenta ?? 1,
          cae: actionResult.data.cae,
          condicionPagoId: actionResult.data.condicionPagoId,
          depositoId: actionResult.data.depositoId ?? null,
        })
        break
      }
    }

    return NextResponse.json(result, { status: 200 })
  }

  const validacion = crearPedidoVentaSchema.safeParse(body)
  if (!validacion.success) {
    return zodErrorResponse(validacion.error)
  }

  try {
    const pedido = await ventasService.crearPedidoVenta({
      ...validacion.data,
      empresaId: auth.empresaId,
      fechaEntregaEst: validacion.data.fechaEntregaEst
        ? new Date(validacion.data.fechaEntregaEst)
        : undefined,
    })

    return NextResponse.json(pedido, { status: 201 })
  } catch (error: unknown) {
    logError("api/ventas/pedidos:POST", error, request as NextRequest)
    const message = error instanceof Error ? error.message : "Error en pedido de venta"
    return NextResponse.json({ error: message }, { status: 400 })
  }
})