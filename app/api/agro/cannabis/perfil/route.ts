import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cannabisService } from "@/lib/agro/cannabis-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const perfil = await cannabisService.obtenerPerfil(auth.auth.empresaId)
  return NextResponse.json(perfil)
}

export async function PUT(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const perfil = await cannabisService.guardarPerfil(auth.auth.empresaId, body)
  return NextResponse.json(perfil)
}