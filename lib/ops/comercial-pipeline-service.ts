import { prisma } from "@/lib/prisma"
import { type PipelineEtapa } from "@/lib/ops/comercial-pipeline-catalog"

export { PIPELINE_ETAPAS, PIPELINE_ETAPA_LABELS, type PipelineEtapa } from "@/lib/ops/comercial-pipeline-catalog"

function db() {
  return prisma as any
}

export type ComercialLeadInput = {
  nombre: string
  negocio?: string
  telefono?: string
  email?: string
  localidad?: string
  rubro?: string
  origen?: string
  etapa?: PipelineEtapa
  valorEstimado?: number
  proximaAccion?: string
  proximaFecha?: string
  notas?: string
}

export type ComercialLeadRow = {
  id: number
  nombre: string
  negocio: string | null
  telefono: string | null
  email: string | null
  localidad: string | null
  rubro: string | null
  origen: string
  etapa: PipelineEtapa
  valorEstimado: number | null
  proximaAccion: string | null
  proximaFecha: string | null
  notas: string | null
  empresaId: number | null
  creadoPor: string
  createdAt: string
  updatedAt: string
}

function mapLead(row: Record<string, unknown>): ComercialLeadRow {
  return {
    id: row.id as number,
    nombre: row.nombre as string,
    negocio: (row.negocio as string | null) ?? null,
    telefono: (row.telefono as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    localidad: (row.localidad as string | null) ?? null,
    rubro: (row.rubro as string | null) ?? null,
    origen: row.origen as string,
    etapa: row.etapa as PipelineEtapa,
    valorEstimado: row.valorEstimado != null ? Number(row.valorEstimado) : null,
    proximaAccion: (row.proximaAccion as string | null) ?? null,
    proximaFecha: row.proximaFecha ? new Date(row.proximaFecha as string).toISOString() : null,
    notas: (row.notas as string | null) ?? null,
    empresaId: (row.empresaId as number | null) ?? null,
    creadoPor: row.creadoPor as string,
    createdAt: new Date(row.createdAt as string).toISOString(),
    updatedAt: new Date(row.updatedAt as string).toISOString(),
  }
}

export async function listComercialLeads(): Promise<ComercialLeadRow[]> {
  const rows = await db().comercialPipelineLead.findMany({
    orderBy: [{ etapa: "asc" }, { updatedAt: "desc" }],
    take: 200,
  })
  return rows.map(mapLead)
}

export async function createComercialLead(
  input: ComercialLeadInput,
  creadoPor: string,
): Promise<ComercialLeadRow> {
  const row = await db().comercialPipelineLead.create({
    data: {
      nombre: input.nombre.trim(),
      negocio: input.negocio?.trim() || null,
      telefono: input.telefono?.trim() || null,
      email: input.email?.trim() || null,
      localidad: input.localidad?.trim() || null,
      rubro: input.rubro?.trim() || null,
      origen: input.origen?.trim() || "calle",
      etapa: input.etapa ?? "prospecto",
      valorEstimado: input.valorEstimado ?? null,
      proximaAccion: input.proximaAccion?.trim() || null,
      proximaFecha: input.proximaFecha ? new Date(input.proximaFecha) : null,
      notas: input.notas?.trim() || null,
      creadoPor: creadoPor.trim().toLowerCase(),
    },
  })
  return mapLead(row)
}

export async function updateComercialLead(
  id: number,
  input: Partial<ComercialLeadInput> & { empresaId?: number | null },
): Promise<ComercialLeadRow | null> {
  const data: Record<string, unknown> = {}
  if (input.nombre !== undefined) data.nombre = input.nombre.trim()
  if (input.negocio !== undefined) data.negocio = input.negocio?.trim() || null
  if (input.telefono !== undefined) data.telefono = input.telefono?.trim() || null
  if (input.email !== undefined) data.email = input.email?.trim() || null
  if (input.localidad !== undefined) data.localidad = input.localidad?.trim() || null
  if (input.rubro !== undefined) data.rubro = input.rubro?.trim() || null
  if (input.origen !== undefined) data.origen = input.origen?.trim() || "calle"
  if (input.etapa !== undefined) data.etapa = input.etapa
  if (input.valorEstimado !== undefined) data.valorEstimado = input.valorEstimado
  if (input.proximaAccion !== undefined) data.proximaAccion = input.proximaAccion?.trim() || null
  if (input.proximaFecha !== undefined) {
    data.proximaFecha = input.proximaFecha ? new Date(input.proximaFecha) : null
  }
  if (input.notas !== undefined) data.notas = input.notas?.trim() || null
  if (input.empresaId !== undefined) data.empresaId = input.empresaId

  try {
    const row = await db().comercialPipelineLead.update({ where: { id }, data })
    return mapLead(row)
  } catch {
    return null
  }
}

export async function getPipelineResumen() {
  const grupos = await db().comercialPipelineLead.groupBy({
    by: ["etapa"],
    _count: { id: true },
    _sum: { valorEstimado: true },
  })

  const porEtapa: Record<string, { count: number; valor: number }> = {}
  let activos = 0
  let valorPipeline = 0

  for (const g of grupos) {
    const count = g._count.id
    const valor = Number(g._sum.valorEstimado ?? 0)
    porEtapa[g.etapa] = { count, valor }
    if (!["descartado", "provisionado"].includes(g.etapa)) {
      activos += count
      valorPipeline += valor
    }
  }

  const proximas = await db().comercialPipelineLead.findMany({
    where: {
      proximaFecha: { not: null, gte: new Date() },
      etapa: { notIn: ["descartado", "provisionado"] },
    },
    orderBy: { proximaFecha: "asc" },
    take: 5,
    select: {
      id: true,
      nombre: true,
      negocio: true,
      etapa: true,
      proximaAccion: true,
      proximaFecha: true,
    },
  })

  return {
    activos,
    valorPipelineArs: valorPipeline,
    porEtapa,
    proximasAcciones: proximas.map((p: Record<string, unknown>) => ({
      id: p.id as number,
      nombre: p.nombre as string,
      negocio: (p.negocio as string | null) ?? null,
      etapa: p.etapa as string,
      proximaAccion: (p.proximaAccion as string | null) ?? null,
      proximaFecha: p.proximaFecha
        ? new Date(p.proximaFecha as string).toISOString()
        : null,
    })),
  }
}