import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cannabisService, ETAPAS_CICLO } from "@/lib/agro/cannabis-service"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await request.json()

  if (!body.etapa || !ETAPAS_CICLO.includes(body.etapa)) {
    return NextResponse.json({ error: "etapa inválida" }, { status: 400 })
  }

  try {
    const ciclo = await cannabisService.avanzarEtapa(
      auth.auth.empresaId,
      Number(id),
      body.etapa,
      body.plantasActuales != null ? Number(body.plantasActuales) : undefined
    )
    return NextResponse.json(ciclo)
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al actualizar etapa" },
      { status: 400 }
    )
  }
}