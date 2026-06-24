import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { agroService } from "@/lib/agro/agro-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const lotes = await agroService.listarLotes(auth.auth.empresaId)
  return NextResponse.json(lotes)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { nombre, superficieHa } = body

  if (!nombre || !superficieHa) {
    return NextResponse.json({ error: "nombre y superficieHa son requeridos" }, { status: 400 })
  }

  const lote = await agroService.crearLote(auth.auth.empresaId, {
    nombre,
    superficieHa: Number(superficieHa),
    geoJson: body.geoJson,
    lat: body.lat ? Number(body.lat) : undefined,
    lon: body.lon ? Number(body.lon) : undefined,
    cultivoActual: body.cultivoActual,
    campana: body.campana,
    renspaProductor: body.renspaProductor,
    proveedorId: body.proveedorId ? Number(body.proveedorId) : undefined,
  })
  return NextResponse.json(lote, { status: 201 })
}

