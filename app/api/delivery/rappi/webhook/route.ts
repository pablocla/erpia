import { NextRequest, NextResponse } from "next/server"
import { procesarPedidoRappi, type RappiPayload } from "@/lib/delivery/rappi-service"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RappiPayload
    const empresaIdParam = request.nextUrl.searchParams.get("empresaId")
    const empresaId = empresaIdParam ? parseInt(empresaIdParam, 10) : body.empresaId || 1

    if (!body.orderId || !body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { ok: false, error: "Payload de Rappi inválido. Se requieren orderId e items." },
        { status: 400 },
      )
    }

    const resultado = await procesarPedidoRappi(body, empresaId)
    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[Rappi Webhook Error]:", error)
    return NextResponse.json(
      { ok: false, error: "Error procesando el pedido de Rappi" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "online",
    canal: "Rappi Partner Webhook Receiver",
    timestamp: new Date().toISOString(),
  })
}
