import { NextRequest, NextResponse } from "next/server"
import { procesarPedidoPedidosYa, type PedidosYaPayload } from "@/lib/delivery/pedidosya-service"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PedidosYaPayload
    const secret = request.headers.get("x-pedidosya-signature") || request.nextUrl.searchParams.get("secret")
    
    // Obtener empresaId del parámetro o default 1 (demo/tenant principal)
    const empresaIdParam = request.nextUrl.searchParams.get("empresaId")
    const empresaId = empresaIdParam ? parseInt(empresaIdParam, 10) : body.empresaId || 1

    if (!body.orderId || !body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { ok: false, error: "Payload de PedidosYa inválido. Se requieren orderId e items." },
        { status: 400 },
      )
    }

    const resultado = await procesarPedidoPedidosYa(body, empresaId)
    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[PedidosYa Webhook Error]:", error)
    return NextResponse.json(
      { ok: false, error: "Error procesando el pedido de PedidosYa" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "online",
    canal: "PedidosYa Partner Webhook Receiver",
    timestamp: new Date().toISOString(),
  })
}
