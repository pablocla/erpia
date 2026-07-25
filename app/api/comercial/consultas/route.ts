import { type NextRequest, NextResponse } from "next/server"
import {
  submitVentasConsulta,
  listConsultasWebRecientes,
  countConsultasWeb7d,
} from "@/lib/comercial/ventas-consulta-service"
import { getAuthContext } from "@/lib/auth/empresa-guard"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const lead = await submitVentasConsulta(body)
    return NextResponse.json({
      ok: true,
      mensaje: "Consulta recibida correctamente. Te contactaremos en menos de 24 h hábiles.",
      lead,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Error al procesar la consulta comercial" },
      { status: 400 },
    )
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const consultas = await listConsultasWebRecientes(20)
    const total7d = await countConsultasWeb7d()
    return NextResponse.json({ ok: true, consultas, total7d })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Error al listar consultas comerciales" },
      { status: 500 },
    )
  }
}
