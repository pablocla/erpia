import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  crearPlantilla,
  iniciarInspeccion,
  registrarResultados,
  listarInspecciones,
  metricasCalidad,
} from "@/lib/calidad/calidad-service"

// GET — Listar inspecciones o métricas
export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const vista = request.nextUrl.searchParams.get("vista") ?? "lista"

  if (vista === "metricas") {
    const data = await metricasCalidad(auth.empresaId)
    return NextResponse.json({ success: true, data })
  }

  const entidad = request.nextUrl.searchParams.get("entidad") ?? undefined
  const estado = request.nextUrl.searchParams.get("estado") ?? undefined
  const data = await listarInspecciones(auth.empresaId, { entidad, estado })
  return NextResponse.json({ success: true, data })
}

// POST — Crear plantilla, iniciar inspección o registrar resultados
export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const body = await request.json()

  if (body.accion === "plantilla") {
    const plantilla = await crearPlantilla({
      empresaId: auth.empresaId,
      nombre: body.nombre,
      entidad: body.entidad,
      criterios: body.criterios,
    })
    return NextResponse.json({ success: true, data: plantilla }, { status: 201 })
  }

  if (body.accion === "iniciar") {
    const inspeccion = await iniciarInspeccion({
      empresaId: auth.empresaId,
      plantillaId: body.plantillaId,
      entidad: body.entidad,
      entidadId: body.entidadId,
      inspectorId: auth.userId,
    })
    return NextResponse.json({ success: true, data: inspeccion }, { status: 201 })
  }

  if (body.accion === "resultados") {
    const resultado = await registrarResultados({
      inspeccionId: body.inspeccionId,
      resultados: body.resultados,
    })
    return NextResponse.json({ success: true, data: resultado })
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
}
