import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getTrabajos, createTrabajo } from "@/lib/oficios/oficios-service"
import type { EstadoTrabajoOficio } from "@prisma/client"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const estado = searchParams.get("estado") as EstadoTrabajoOficio | null
  const q = searchParams.get("q") ?? undefined

  try {
    const trabajos = await getTrabajos(auth.auth.empresaId, {
      estado: estado ?? undefined,
      q,
    })
    return NextResponse.json({ ok: true, data: trabajos })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const nuevoTrabajo = await createTrabajo(auth.auth.empresaId, body)
    return NextResponse.json({ ok: true, data: nuevoTrabajo }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  }
}
