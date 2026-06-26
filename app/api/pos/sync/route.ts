import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { VentasService } from "@/lib/ventas/ventas-service"

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { pedidosOffline } = body

    if (!Array.isArray(pedidosOffline)) {
      return NextResponse.json({ error: "El payload debe contener un arreglo de pedidosOffline" }, { status: 400 })
    }

    const ventasService = new VentasService()
    const resultados = []

    for (const pedido of pedidosOffline) {
      try {
        const nuevoPedido = await ventasService.crearPedidoVenta({
          empresaId: auth.auth.empresaId,
          clienteId: pedido.clienteId,
          vendedorId: pedido.vendedorId || auth.auth.userId,
          condicionPagoId: pedido.condicionPagoId,
          canalVentaId: pedido.canalVentaId,
          lineas: pedido.lineas.map((l: any) => ({
            productoId: l.productoId,
            descripcion: l.descripcion,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario
          })),
          observaciones: pedido.observaciones || "Sincronizado offline",
          usarListaPrecios: false // Ya viene con precio cerrado desde el POS offline
        })
        
        // Mover estado
        if (pedido.estado === "confirmado") {
           await ventasService.confirmarPedido(nuevoPedido.id, auth.auth.empresaId)
        }
        
        resultados.push({ idLocal: pedido.idLocal, success: true, serverId: nuevoPedido.id })
      } catch (err: any) {
        resultados.push({ idLocal: pedido.idLocal, success: false, error: err.message })
      }
    }

    return NextResponse.json({
      success: true,
      resultados
    })
  } catch (error) {
    console.error("Error en POS sync:", error)
    return NextResponse.json({ error: "Error interno de sincronización" }, { status: 500 })
  }
}
