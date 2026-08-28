import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { listarContratosAlquiler, crearContratoAlquiler } from "@/lib/oficios/alquiler-maquinaria-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get("estado") || undefined

  try {
    const data = await listarContratosAlquiler(auth.auth.empresaId, estado)
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const contrato = await crearContratoAlquiler(auth.auth.empresaId, {
      ...body,
      fechaPactadaDevolucion: new Date(body.fechaPactadaDevolucion),
    })
    return NextResponse.json({ ok: true, data: contrato }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
