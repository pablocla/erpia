import { prisma } from "@/lib/prisma"
import type { ReportDefinition } from "@/lib/reporting/semantic/types"
import type { Prisma } from "@prisma/client"

export async function listReportDefinitions(empresaId: number, usuarioId?: number) {
  return prisma.analyticsSmartView.findMany({
    where: {
      empresaId,
      OR: usuarioId
        ? [{ usuarioId }, { esPublica: true }]
        : undefined,
    },
    orderBy: { updatedAt: "desc" },
  })
}

export async function getReportDefinition(id: number, empresaId: number) {
  return prisma.analyticsSmartView.findFirst({
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
  return prisma.analyticsSmartView.create({
    data: {
      empresaId: input.empresaId,
      usuarioId: input.creadoPor,
      codigo: input.codigo,
      nombre: input.nombre,
      descripcion: input.descripcion,
      connectorId: input.connectorId ?? "claverp",
      tipoVista: input.tipoVista,
      definicion: input.definicion as Prisma.InputJsonValue,
      esPublica: input.publico ?? false,
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
    esFavorita: boolean
  }>,
) {
  const existing = await prisma.analyticsSmartView.findFirst({ where: { id, empresaId } })
  if (!existing) return null

  const patch: Prisma.AnalyticsSmartViewUpdateInput = {}
  if (data.nombre !== undefined) patch.nombre = data.nombre
  if (data.descripcion !== undefined) patch.descripcion = data.descripcion
  if (data.tipoVista !== undefined) patch.tipoVista = data.tipoVista
  if (data.definicion !== undefined) patch.definicion = data.definicion as Prisma.InputJsonValue
  if (data.publico !== undefined) patch.esPublica = data.publico
  if (data.esFavorita !== undefined) patch.esFavorita = data.esFavorita

  return prisma.analyticsSmartView.update({
    where: { id },
    data: patch,
  })
}

export async function deleteReportDefinition(id: number, empresaId: number) {
  const row = await prisma.analyticsSmartView.findFirst({ where: { id, empresaId } })
  if (!row) return null
  return prisma.analyticsSmartView.delete({ where: { id } })
}