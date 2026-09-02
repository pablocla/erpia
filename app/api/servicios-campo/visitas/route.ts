import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { ServiciosCampoService, type VisitaCampoInput } from "@/lib/servicios-campo/servicios-campo-service"

const campoService = new ServiciosCampoService()

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const visitas = await campoService.listarVisitas(auth.auth.empresaId)
    return NextResponse.json({ ok: true, visitas })
  } catch (error) {
    console.error("[GET /api/servicios-campo/visitas] Error:", error)
    return NextResponse.json({ error: "Error obteniendo visitas de campo" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = (await request.json()) as VisitaCampoInput
    if (!body.clienteId || !body.direccion || !body.motivoVisita) {
      return NextResponse.json({ error: "Cliente, dirección y motivo son obligatorios" }, { status: 400 })
    }

    const visita = await campoService.registrarVisita(auth.auth.empresaId, body)
    return NextResponse.json({ ok: true, visita }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/servicios-campo/visitas] Error:", error)
    return NextResponse.json({ error: "Error al registrar visita de campo" }, { status: 500 })
  }
}
