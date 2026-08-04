import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getListaPrestamos, crearPrestamo } from "@/lib/prestamos/prestamos-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const prestamos = await getListaPrestamos(ctx.auth.empresaId)
    return NextResponse.json(prestamos)
  } catch (error) {
    console.error("Error al obtener préstamos:", error)
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const body = await request.json()
    if (!body.cliente || !body.capital) {
      return NextResponse.json({ error: "CLIENTE_Y_CAPITAL_REQUERIDOS" }, { status: 400 })
    }

    const nuevo = await crearPrestamo(ctx.auth.empresaId, {
      cliente: body.cliente,
      capital: Number(body.capital),
      interesPct: body.interesPct ? Number(body.interesPct) : 30,
      observaciones: body.observaciones,
      telefono: body.telefono
    })

    return NextResponse.json(nuevo, { status: 201 })
  } catch (error) {
    console.error("Error al crear préstamo:", error)
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
