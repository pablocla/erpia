import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  crearReglaAlerta,
  listarReglasAlerta,
  toggleReglaAlerta,
  eliminarReglaAlerta,
  evaluarReglas,
} from "@/lib/alertas/alertas-service"

export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response

  const reglas = await listarReglasAlerta(authResult.auth.empresaId)
  return NextResponse.json(reglas)
}

export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { empresaId } = authResult.auth

  const body = await request.json()

  if (body.accion === "evaluar") {
    const resultado = await evaluarReglas(empresaId)
    return NextResponse.json(resultado)
  }

  if (body.accion === "toggle") {
    const updated = await toggleReglaAlerta(empresaId, body.id, body.activo)
    return NextResponse.json(updated)
  }

  // Crear nueva regla
  const regla = await crearReglaAlerta({
    empresaId,
    nombre: body.nombre,
    tipoRegla: body.tipoRegla,
    condicion: body.condicion,
    accion: body.accion_alerta,
    destinatarioId: body.destinatarioId,
    emailDestino: body.emailDestino,
    frecuenciaHoras: body.frecuenciaHoras,
  })
  return NextResponse.json(regla, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response

  const { searchParams } = new URL(request.url)
  const reglaId = Number(searchParams.get("id"))
  if (!reglaId) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  await eliminarReglaAlerta(authResult.auth.empresaId, reglaId)
  return NextResponse.json({ ok: true })
}
