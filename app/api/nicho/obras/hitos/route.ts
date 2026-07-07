import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  certificarHitoObra,
  crearHitoObra,
  listHitosObra,
} from "@/lib/nicho/hito-obra-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const obra = request.nextUrl.searchParams.get("obra") ?? undefined
  const hitos = await listHitosObra(auth.auth.empresaId, obra)
  return NextResponse.json(hitos)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()

  if (body.action === "certificar" && body.hitoId) {
    const hito = await certificarHitoObra(auth.auth.empresaId, Number(body.hitoId))
    return NextResponse.json(hito)
  }

  if (body.obraNombre && body.hitoNombre && body.monto != null) {
    const hito = await crearHitoObra(auth.auth.empresaId, {
      obraNombre: body.obraNombre,
      hitoNombre: body.hitoNombre,
      porcentajeAvance: Number(body.porcentajeAvance ?? 0),
      monto: Number(body.monto),
      clienteId: body.clienteId ? Number(body.clienteId) : undefined,
      observaciones: body.observaciones,
    })
    return NextResponse.json(hito)
  }

  return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
}