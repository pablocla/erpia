import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { TallerMecanicoService, type VehiculoTallerInput } from "@/lib/taller/taller-mecanico-service"

const tallerService = new TallerMecanicoService()

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const patente = searchParams.get("patente") || undefined

  try {
    const ordenes = await tallerService.listarReparaciones(auth.auth.empresaId, patente)
    return NextResponse.json({ ok: true, ordenes })
  } catch (error) {
    console.error("[GET /api/taller/vehiculos] Error:", error)
    return NextResponse.json({ error: "Error obteniendo las órdenes del taller" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = (await request.json()) as VehiculoTallerInput
    if (!body.clienteId || !body.patente || !body.marca || !body.fallaReportada) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios (cliente, patente, marca y motivo de ingreso)" },
        { status: 400 }
      )
    }

    const orden = await tallerService.crearOrdenVehiculo(auth.auth.empresaId, body)
    return NextResponse.json({ ok: true, orden }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/taller/vehiculos] Error:", error)
    return NextResponse.json({ error: "Error al registrar ingreso de vehículo" }, { status: 500 })
  }
}
