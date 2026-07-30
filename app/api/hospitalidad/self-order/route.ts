import { NextRequest, NextResponse } from "next/server"
import { procesarSelfOrderMesa, type SelfOrderGuestPayload } from "@/lib/hospitalidad/self-order-service"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SelfOrderGuestPayload

    if (!body.mesaNumero || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Mesa e items requeridos para procesar el Self-Order QR." },
        { status: 400 },
      )
    }

    const resultado = procesarSelfOrderMesa({
      ...body,
      empresaId: body.empresaId || 1,
    })

    return NextResponse.json(resultado)
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Error procesando el Self-Order QR de la mesa" },
      { status: 500 },
    )
  }
}
