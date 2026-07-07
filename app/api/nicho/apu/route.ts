import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cotizarApu, listApuItems, seedApuEmpresa } from "@/lib/nicho/apu-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const items = await listApuItems(auth.auth.empresaId)
  return NextResponse.json(items)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()

  if (body.action === "seed") {
    await seedApuEmpresa(auth.auth.empresaId)
    return NextResponse.json({ ok: true })
  }

  if (body.codigo && body.cantidad) {
    const cotizacion = await cotizarApu(auth.auth.empresaId, body.codigo, Number(body.cantidad))
    return NextResponse.json(cotizacion)
  }

  return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
}