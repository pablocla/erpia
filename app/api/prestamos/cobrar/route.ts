import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { registrarCobroPrestamo } from "@/lib/prestamos/prestamos-service"

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const body = await request.json()
    if (!body.clienteId || !body.monto) {
      return NextResponse.json({ error: "CLIENTE_ID_Y_MONTO_REQUERIDOS" }, { status: 400 })
    }

    const cobro = await registrarCobroPrestamo(ctx.auth.empresaId, {
      clienteId: Number(body.clienteId),
      monto: Number(body.monto)
    })

    return NextResponse.json(cobro)
  } catch (error) {
    console.error("Error al registrar cobro de préstamo:", error)
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
