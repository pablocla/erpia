import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { procesarPedidosAutomaticosProveedores } from "@/lib/marketplace/pedido-automatico-service"

/**
 * POST /api/marketplace/intangibles/reponedor/pedido-auto
 * Dispara el proceso de generación de pedidos de reposición JIT borrador
 * y encola los mensajes de WhatsApp para los proveedores.
 */
export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { empresaId } = ctx.auth

  try {
    const res = await procesarPedidosAutomaticosProveedores(empresaId)
    return NextResponse.json(res)
  } catch (err) {
    console.error("[PedidosAuto API] Error:", err)
    return NextResponse.json(
      { error: "Error interno al procesar pedidos automáticos: " + (err as Error).message },
      { status: 500 },
    )
  }
}
