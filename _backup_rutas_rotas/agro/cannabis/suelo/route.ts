import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cannabisService } from "@/lib/agro/cannabis-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const cicloId = searchParams.get("cicloId")
  const salaId = searchParams.get("salaId")

  const analisis = await cannabisService.listarAnalisisSuelo(auth.auth.empresaId, {
    cicloId: cicloId ? Number(cicloId) : undefined,
    salaId: salaId ? Number(salaId) : undefined,
  })
  return NextResponse.json(analisis)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()

  const analisis = await cannabisService.registrarAnalisisSuelo(auth.auth.empresaId, body)
  return NextResponse.json(analisis, { status: 201 })
}