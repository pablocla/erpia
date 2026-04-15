import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  crearFacturaRecurrente,
  listarFacturasRecurrentes,
  procesarFacturasRecurrentes,
  toggleFacturaRecurrente,
} from "@/lib/ventas/facturacion-recurrente-service"

export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response

  const lista = await listarFacturasRecurrentes(authResult.auth.empresaId)
  return NextResponse.json(lista)
}

export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { empresaId } = authResult.auth

  const body = await request.json()

  if (body.accion === "procesar") {
    const resultado = await procesarFacturasRecurrentes(empresaId)
    return NextResponse.json(resultado)
  }

  if (body.accion === "toggle") {
    const updated = await toggleFacturaRecurrente(empresaId, body.id, body.activo)
    return NextResponse.json(updated)
  }

  // Crear nueva factura recurrente
  const fr = await crearFacturaRecurrente({
    empresaId,
    clienteId: body.clienteId,
    concepto: body.concepto,
    montoNeto: body.montoNeto,
    alicuotaIva: body.alicuotaIva,
    frecuencia: body.frecuencia,
    diaEmision: body.diaEmision,
    tipoCbte: body.tipoCbte,
    fechaFin: body.fechaFin ? new Date(body.fechaFin) : undefined,
  })
  return NextResponse.json(fr, { status: 201 })
}
