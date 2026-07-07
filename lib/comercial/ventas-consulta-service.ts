import { prisma } from "@/lib/prisma"
import { notifyAnalistasFunnel } from "@/lib/comercial/comercial-funnel-service"
import { createComercialLead, type ComercialLeadRow } from "@/lib/ops/comercial-pipeline-service"
import {
  VENTAS_CONSULTA_TIPO_LABELS,
  type VentasConsultaTipo,
} from "@/lib/comercial/ventas-consulta-catalog"

function db() {
  return prisma as any
}

export type VentasConsultaInput = {
  nombre: string
  email: string
  telefono?: string
  negocio?: string
  rubro?: string
  mensaje?: string
  tipo?: VentasConsultaTipo
  pagina?: string
  /** Campo honeypot — debe venir vacío */
  website?: string
}

function proximaAccionPorTipo(tipo: VentasConsultaTipo): string {
  switch (tipo) {
    case "reunion":
      return "Agendar reunión — contactar en 24 h"
    case "demo":
      return "Enviar acceso demo / llamar"
    default:
      return "Responder consulta comercial"
  }
}

function buildNotas(input: VentasConsultaInput, tipo: VentasConsultaTipo): string {
  const partes = [
    `[${VENTAS_CONSULTA_TIPO_LABELS[tipo]}]`,
    input.mensaje?.trim(),
    input.pagina ? `Página: ${input.pagina}` : null,
  ].filter(Boolean)
  return partes.join("\n\n")
}

export async function submitVentasConsulta(input: VentasConsultaInput): Promise<ComercialLeadRow> {
  if (input.website?.trim()) {
    throw new Error("Solicitud rechazada")
  }

  const nombre = input.nombre?.trim()
  const email = input.email?.trim().toLowerCase()
  if (!nombre || !email) {
    throw new Error("Nombre y email son obligatorios")
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email inválido")
  }

  const tipo: VentasConsultaTipo =
    input.tipo && VENTAS_CONSULTA_TIPO_LABELS[input.tipo] ? input.tipo : "contacto"

  const lead = await createComercialLead(
    {
      nombre,
      email,
      telefono: input.telefono,
      negocio: input.negocio,
      rubro: input.rubro,
      origen: "web",
      etapa: "prospecto",
      proximaAccion: proximaAccionPorTipo(tipo),
      notas: buildNotas(input, tipo),
    },
    "web@claver.com.ar",
  )

  void notifyAnalistasFunnel("consulta_web", lead)
  return lead
}

export async function countConsultasWeb7d(): Promise<number> {
  const desde = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return db().comercialPipelineLead.count({
    where: {
      origen: { in: ["web", "web_register", "industry_demo"] },
      createdAt: { gte: desde },
    },
  })
}

export async function listConsultasWebRecientes(take = 8): Promise<ComercialLeadRow[]> {
  const rows = await db().comercialPipelineLead.findMany({
    where: { origen: { in: ["web", "web_register", "industry_demo"] } },
    orderBy: { createdAt: "desc" },
    take,
  })
  return rows.map((row: Record<string, unknown>) => ({
    id: row.id as number,
    nombre: row.nombre as string,
    negocio: (row.negocio as string | null) ?? null,
    telefono: (row.telefono as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    localidad: (row.localidad as string | null) ?? null,
    rubro: (row.rubro as string | null) ?? null,
    origen: row.origen as string,
    etapa: row.etapa as ComercialLeadRow["etapa"],
    valorEstimado: row.valorEstimado != null ? Number(row.valorEstimado) : null,
    proximaAccion: (row.proximaAccion as string | null) ?? null,
    proximaFecha: row.proximaFecha ? new Date(row.proximaFecha as string).toISOString() : null,
    notas: (row.notas as string | null) ?? null,
    lat: (row.lat as number | null) ?? null,
    lon: (row.lon as number | null) ?? null,
    empresaId: (row.empresaId as number | null) ?? null,
    creadoPor: row.creadoPor as string,
    createdAt: new Date(row.createdAt as string).toISOString(),
    updatedAt: new Date(row.updatedAt as string).toISOString(),
  }))
}