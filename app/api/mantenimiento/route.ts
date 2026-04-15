import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  crearPlanMantenimiento,
  listarPlanesMantenimiento,
  crearOrdenTrabajo,
  actualizarOrdenTrabajo,
  listarOrdenesTrabajo,
  generarOTsPreventivas,
  resumenMantenimiento,
} from "@/lib/mantenimiento/mantenimiento-service"

export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { empresaId } = authResult.auth

  const { searchParams } = new URL(request.url)
  const vista = searchParams.get("vista")

  if (vista === "resumen") {
    const resumen = await resumenMantenimiento(empresaId)
    return NextResponse.json(resumen)
  }

  if (vista === "ordenes") {
    const ordenes = await listarOrdenesTrabajo(empresaId, {
      estado: searchParams.get("estado") ?? undefined,
      prioridad: searchParams.get("prioridad") ?? undefined,
    })
    return NextResponse.json(ordenes)
  }

  // Default: planes
  const planes = await listarPlanesMantenimiento(empresaId)
  return NextResponse.json(planes)
}

export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { empresaId } = authResult.auth

  const body = await request.json()

  if (body.accion === "plan") {
    const plan = await crearPlanMantenimiento({
      empresaId,
      nombre: body.nombre,
      descripcion: body.descripcion,
      frecuencia: body.frecuencia,
      proximaEjecucion: new Date(body.proximaEjecucion),
      activoFijoId: body.activoFijoId,
      equipo: body.equipo,
      responsable: body.responsable,
      costoEstimado: body.costoEstimado,
    })
    return NextResponse.json(plan, { status: 201 })
  }

  if (body.accion === "orden") {
    const ot = await crearOrdenTrabajo(empresaId, {
      planId: body.planId,
      tipo: body.tipo,
      descripcion: body.descripcion,
      prioridad: body.prioridad,
      fechaProgramada: new Date(body.fechaProgramada),
      tecnicoAsignado: body.tecnicoAsignado,
    })
    return NextResponse.json(ot, { status: 201 })
  }

  if (body.accion === "generar_preventivas") {
    const resultado = await generarOTsPreventivas(empresaId)
    return NextResponse.json(resultado)
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
}

export async function PUT(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response

  const body = await request.json()
  const { id, ...data } = body

  const updated = await actualizarOrdenTrabajo(authResult.auth.empresaId, id, {
    ...data,
    fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
    fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
  })
  return NextResponse.json(updated)
}
