import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cannabisService } from "@/lib/agro/cannabis-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const geneticas = await cannabisService.listarGeneticas(auth.auth.empresaId)
  return NextResponse.json(geneticas)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  if (!body.nombre) {
    return NextResponse.json({ error: "nombre es requerido" }, { status: 400 })
  }

  const genetica = await cannabisService.crearGenetica(auth.auth.empresaId, body)
  return NextResponse.json(genetica, { status: 201 })
}