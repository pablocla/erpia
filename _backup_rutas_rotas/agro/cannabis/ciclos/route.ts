import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cannabisService } from "@/lib/agro/cannabis-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const etapa = searchParams.get("etapa") ?? undefined
  const activos = searchParams.get("activos") === "true"

  const ciclos = await cannabisService.listarCiclos(auth.auth.empresaId, { etapa, activos })
  return NextResponse.json(ciclos)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  if (!body.salaId || !body.geneticaId || body.plantasIniciales == null) {
    return NextResponse.json(
      { error: "salaId, geneticaId y plantasIniciales son requeridos" },
      { status: 400 }
    )
  }

  try {
    const ciclo = await cannabisService.crearCiclo(auth.auth.empresaId, {
      salaId: Number(body.salaId),
      geneticaId: Number(body.geneticaId),
      plantasIniciales: Number(body.plantasIniciales),
      etapa: body.etapa,
      observaciones: body.observaciones,
    })
    return NextResponse.json(ciclo, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al crear ciclo" },
      { status: 400 }
    )
  }
}