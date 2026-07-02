import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cannabisService } from "@/lib/agro/cannabis-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const categoria = searchParams.get("categoria") ?? undefined

  const insumos = await cannabisService.listarInsumos(auth.auth.empresaId, categoria)
  return NextResponse.json(insumos)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  if (!body.codigo || !body.nombre || !body.categoria) {
    return NextResponse.json(
      { error: "codigo, nombre y categoria son requeridos" },
      { status: 400 }
    )
  }

  const insumo = await cannabisService.crearInsumo(auth.auth.empresaId, body)
  return NextResponse.json(insumo, { status: 201 })
}