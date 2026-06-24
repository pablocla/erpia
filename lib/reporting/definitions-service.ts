import { prisma } from "@/lib/prisma"
import type { ReportDefinition } from "@/lib/reporting/semantic/types"

export async function listReportDefinitions(empresaId: number) {
  const db = prisma as any
  return db.reporteDefinicion.findMany({
    where: { empresaId },
    orderBy: { updatedAt: "desc" },
  })
}

export async function getReportDefinition(id: number, empresaId: number) {
  const db = prisma as any
  return db.reporteDefinicion.findFirst({
    where: { id, empresaId },
  })
}

export async function createReportDefinition(input: {
  empresaId: number
  codigo: string
  nombre: string
  descripcion?: string
  connectorId?: string
  tipoVista: string
  definicion: ReportDefinition
  creadoPor?: number
  publico?: boolean
}) {
  const db = prisma as any
  return db.reporteDefinicion.create({
    data: {
      empresaId: input.empresaId,
      codigo: input.codigo,
      nombre: input.nombre,
      descripcion: input.descripcion,
      connectorId: input.connectorId ?? "claverp",
      tipoVista: input.tipoVista,
      definicion: input.definicion,
      creadoPor: input.creadoPor,
      publico: input.publico ?? false,
    },
  })
}

export async function updateReportDefinition(
  id: number,
  empresaId: number,
  data: Partial<{
    nombre: string
    descripcion: string
    tipoVista: string
    definicion: ReportDefinition
    publico: boolean
  }>,
) {
  const db = prisma as any
  const existing = await db.reporteDefinicion.findFirst({ where: { id, empresaId } })
  if (!existing) return null
  return db.reporteDefinicion.update({
    where: { id },
    data,
  })
}

export async function deleteReportDefinition(id: number, empresaId: number) {
  const db = prisma as any
  const row = await db.reporteDefinicion.findFirst({ where: { id, empresaId } })
  if (!row) return null
  return db.reporteDefinicion.delete({ where: { id } })
}