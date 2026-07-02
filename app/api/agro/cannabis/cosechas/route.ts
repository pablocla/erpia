import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cannabisService } from "@/lib/agro/cannabis-service"

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  if (!body.cicloId || body.plantasCosechadas == null) {
    return NextResponse.json(
      { error: "cicloId y plantasCosechadas son requeridos" },
      { status: 400 }
    )
  }

  try {
    const cosecha = await cannabisService.registrarCosecha(auth.auth.empresaId, {
      cicloId: Number(body.cicloId),
      plantasCosechadas: Number(body.plantasCosechadas),
      pesoHumedoKg: body.pesoHumedoKg != null ? Number(body.pesoHumedoKg) : undefined,
      pesoSecoKg: body.pesoSecoKg != null ? Number(body.pesoSecoKg) : undefined,
      destino: body.destino,
      loteTrazabilidad: body.loteTrazabilidad,
      observaciones: body.observaciones,
      fecha: body.fecha,
    })
    return NextResponse.json(cosecha, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al registrar cosecha" },
      { status: 400 }
    )
  }
}