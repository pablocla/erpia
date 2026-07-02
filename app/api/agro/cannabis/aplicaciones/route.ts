import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cannabisService } from "@/lib/agro/cannabis-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const cicloId = searchParams.get("cicloId")
  const limit = searchParams.get("limit")

  const aplicaciones = await cannabisService.listarAplicaciones(auth.auth.empresaId, {
    cicloId: cicloId ? Number(cicloId) : undefined,
    limit: limit ? Number(limit) : undefined,
  })
  return NextResponse.json(aplicaciones)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  if (!body.cicloId || !body.insumoId || body.cantidad == null) {
    return NextResponse.json(
      { error: "cicloId, insumoId y cantidad son requeridos" },
      { status: 400 }
    )
  }

  try {
    const aplicacion = await cannabisService.registrarAplicacion(auth.auth.empresaId, {
      cicloId: Number(body.cicloId),
      insumoId: Number(body.insumoId),
      cantidad: Number(body.cantidad),
      unidad: body.unidad,
      dosis: body.dosis,
      operador: body.operador,
      metodo: body.metodo,
      observaciones: body.observaciones,
      fecha: body.fecha,
    })
    return NextResponse.json(aplicacion, { status: 201 })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al registrar aplicación" },
      { status: 400 }
    )
  }
}