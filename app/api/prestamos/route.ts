import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  crearPrestamo,
  getListaCobrarHoy,
  getListaPrestamos,
  listarClientesParaPrestamo,
} from "@/lib/prestamos/prestamos-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const scope = request.nextUrl.searchParams.get("scope")
    if (scope === "hoy") {
      const prestamos = await getListaCobrarHoy(ctx.auth.empresaId)
      return NextResponse.json(prestamos)
    }
    if (scope === "clientes") {
      const clientes = await listarClientesParaPrestamo(ctx.auth.empresaId)
      return NextResponse.json(clientes)
    }
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
    if (!body.capital && body.capital !== 0) {
      return NextResponse.json({ error: "CAPITAL_REQUERIDO" }, { status: 400 })
    }
    if (!body.cliente && !body.clienteId) {
      return NextResponse.json({ error: "CLIENTE_REQUERIDO" }, { status: 400 })
    }

    const nuevo = await crearPrestamo(ctx.auth.empresaId, {
      cliente: body.cliente,
      clienteId: body.clienteId ? Number(body.clienteId) : undefined,
      capital: Number(body.capital),
      interesPct: body.interesPct != null ? Number(body.interesPct) : 30,
      fechaVencimiento: body.fechaVencimiento,
      observaciones: body.observaciones,
      telefono: body.telefono,
    })

    return NextResponse.json(nuevo, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "INTERNAL_ERROR"
    if (msg === "CAPITAL_INVALIDO" || msg === "CLIENTE_REQUERIDO") {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    console.error("Error al crear préstamo:", error)
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
