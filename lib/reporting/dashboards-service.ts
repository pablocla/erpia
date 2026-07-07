import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export interface DashboardWidget {
  smartViewId?: number
  titulo: string
  tipoGrafico?: string
  refreshSec?: number
}

export interface DashboardLayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  smartViewId?: number
}

export async function listDashboards(empresaId: number, usuarioId?: number) {
  return prisma.analyticsDashboard.findMany({
    where: {
      empresaId,
      OR: usuarioId ? [{ usuarioId }, { esDefault: true }] : undefined,
    },
    orderBy: [{ esDefault: "desc" }, { updatedAt: "desc" }],
  })
}

export async function getDashboard(id: number, empresaId: number) {
  return prisma.analyticsDashboard.findFirst({
    where: { id, empresaId },
  })
}

export async function createDashboard(input: {
  empresaId: number
  usuarioId?: number
  nombre: string
  descripcion?: string
  layout?: DashboardLayoutItem[]
  widgets?: DashboardWidget[]
  esDefault?: boolean
}) {
  return prisma.analyticsDashboard.create({
    data: {
      empresaId: input.empresaId,
      usuarioId: input.usuarioId,
      nombre: input.nombre,
      descripcion: input.descripcion,
      layout: (input.layout ?? []) as unknown as Prisma.InputJsonValue,
      widgets: (input.widgets ?? []) as unknown as Prisma.InputJsonValue,
      esDefault: input.esDefault ?? false,
    },
  })
}

export async function updateDashboard(
  id: number,
  empresaId: number,
  data: Partial<{
    nombre: string
    descripcion: string
    layout: DashboardLayoutItem[]
    widgets: DashboardWidget[]
    esDefault: boolean
  }>,
) {
  const existing = await prisma.analyticsDashboard.findFirst({ where: { id, empresaId } })
  if (!existing) return null

  const patch: Prisma.AnalyticsDashboardUpdateInput = {}
  if (data.nombre !== undefined) patch.nombre = data.nombre
  if (data.descripcion !== undefined) patch.descripcion = data.descripcion
  if (data.layout !== undefined) patch.layout = data.layout as unknown as Prisma.InputJsonValue
  if (data.widgets !== undefined) patch.widgets = data.widgets as unknown as Prisma.InputJsonValue
  if (data.esDefault !== undefined) patch.esDefault = data.esDefault

  return prisma.analyticsDashboard.update({
    where: { id },
    data: patch,
  })
}

export async function deleteDashboard(id: number, empresaId: number) {
  const row = await prisma.analyticsDashboard.findFirst({ where: { id, empresaId } })
  if (!row) return null
  return prisma.analyticsDashboard.delete({ where: { id } })
}