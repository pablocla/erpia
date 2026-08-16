import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { listarMaquinarias, crearMaquinaria } from "@/lib/oficios/alquiler-maquinaria-service"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get("estado") || undefined

  try {
    const data = await listarMaquinarias(auth.auth.empresaId, estado)
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const maquina = await crearMaquinaria(auth.auth.empresaId, body)
    return NextResponse.json({ ok: true, data: maquina }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
