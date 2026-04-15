import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  obtenerConfigMP,
  guardarConfigMP,
  listarTransaccionesMP,
  resumenMP,
} from "@/lib/mercadopago/mercadopago-service"

export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { empresaId } = authResult.auth

  const { searchParams } = new URL(request.url)
  const vista = searchParams.get("vista")

  if (vista === "config") {
    const config = await obtenerConfigMP(empresaId)
    // No exponer tokens en la respuesta
    if (config) {
      return NextResponse.json({
        ...config,
        accessToken: config.accessToken ? "••••••••" : null,
        webhookSecret: config.webhookSecret ? "••••••••" : null,
      })
    }
    return NextResponse.json(null)
  }

  if (vista === "resumen") {
    const resumen = await resumenMP(empresaId)
    return NextResponse.json(resumen)
  }

  // Default: listar transacciones
  const transacciones = await listarTransaccionesMP(empresaId)
  return NextResponse.json(transacciones)
}

export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { empresaId } = authResult.auth

  const body = await request.json()

  if (body.accion === "config") {
    const config = await guardarConfigMP(empresaId, {
      accessToken: body.accessToken,
      publicKey: body.publicKey,
      mpUserId: body.mpUserId,
      nombreCuenta: body.nombreCuenta,
      webhookSecret: body.webhookSecret,
      qrHabilitado: body.qrHabilitado,
      checkoutHabilitado: body.checkoutHabilitado,
    })
    return NextResponse.json(config)
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
}
