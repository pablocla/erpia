import { NextRequest, NextResponse } from "next/server"
import { procesarSelfOrderMesa, type SelfOrderGuestPayload } from "@/lib/hospitalidad/self-order-service"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SelfOrderGuestPayload

    if (!body.empresaId || typeof body.empresaId !== "number") {
      return NextResponse.json(
        { ok: false, error: "Identificador de empresa requerido para Self-Order." },
        { status: 400 },
      )
    }

    if (!body.mesaNumero || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Mesa e items requeridos para procesar el Self-Order QR." },
        { status: 400 },
      )
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: body.empresaId },
      select: { id: true },
    })
    if (!empresa) {
      return NextResponse.json(
        { ok: false, error: "Comercio no encontrado." },
        { status: 404 },
      )
    }

    const resultado = procesarSelfOrderMesa(body)
    return NextResponse.json(resultado)
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Error procesando el Self-Order QR de la mesa" },
      { status: 500 },
    )
  }
}
