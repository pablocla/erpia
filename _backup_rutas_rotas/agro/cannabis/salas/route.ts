import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cannabisService } from "@/lib/agro/cannabis-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const salas = await cannabisService.listarSalas(auth.auth.empresaId)
  return NextResponse.json(salas)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  if (!body.nombre) {
    return NextResponse.json({ error: "nombre es requerido" }, { status: 400 })
  }

  const sala = await cannabisService.crearSala(auth.auth.empresaId, body)
  return NextResponse.json(sala, { status: 201 })
}