import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  crearLead,
  actualizarEstadoLead,
  crearOportunidad,
  avanzarEtapa,
  pipelineResumen,
  registrarActividad,
  metricasCRM,
} from "@/lib/crm/crm-service"
import { prisma } from "@/lib/prisma"

// GET — Pipeline, leads, oportunidades o métricas
export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const vista = request.nextUrl.searchParams.get("vista") ?? "pipeline"

  if (vista === "pipeline") {
    const data = await pipelineResumen(auth.empresaId)
    return NextResponse.json({ success: true, data })
  }

  if (vista === "metricas") {
    const data = await metricasCRM(auth.empresaId)
    return NextResponse.json({ success: true, data })
  }

  if (vista === "leads") {
    const estado = request.nextUrl.searchParams.get("estado")
    const where: Record<string, unknown> = { empresaId: auth.empresaId }
    if (estado) where.estado = estado
    const data = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    return NextResponse.json({ success: true, data })
  }

  if (vista === "oportunidades") {
    const etapa = request.nextUrl.searchParams.get("etapa")
    const where: Record<string, unknown> = { empresaId: auth.empresaId }
    if (etapa) where.etapa = etapa
    const data = await prisma.oportunidad.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
    })
    return NextResponse.json({ success: true, data })
  }

  return NextResponse.json({ error: "Vista no válida" }, { status: 400 })
}

// POST — Crear lead, oportunidad, actividad o avanzar etapa
export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const body = await request.json()

  if (body.accion === "crear_lead") {
    const lead = await crearLead({ empresaId: auth.empresaId, ...body })
    return NextResponse.json({ success: true, data: lead }, { status: 201 })
  }

  if (body.accion === "actualizar_lead") {
    const lead = await actualizarEstadoLead(auth.empresaId, body.leadId, body.estado)
    return NextResponse.json({ success: true, data: lead })
  }

  if (body.accion === "crear_oportunidad") {
    const op = await crearOportunidad({ empresaId: auth.empresaId, ...body })
    return NextResponse.json({ success: true, data: op }, { status: 201 })
  }

  if (body.accion === "avanzar_etapa") {
    const op = await avanzarEtapa(auth.empresaId, body.oportunidadId, body.etapa, {
      montoReal: body.montoReal,
      motivoPerdida: body.motivoPerdida,
    })
    return NextResponse.json({ success: true, data: op })
  }

  if (body.accion === "actividad") {
    const act = await registrarActividad({
      empresaId: auth.empresaId,
      tipo: body.tipo,
      descripcion: body.descripcion,
      usuarioId: auth.userId,
      leadId: body.leadId,
      oportunidadId: body.oportunidadId,
    })
    return NextResponse.json({ success: true, data: act }, { status: 201 })
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
}
