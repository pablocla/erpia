import { prisma } from "@/lib/prisma"
import { getRunbookOrDefault } from "./product-runbooks"
import type { AutoCertLevel } from "./marketplace-catalog"

export async function resolverAnalistaEmpresa(empresaId: number): Promise<string | null> {
  const asignacion = await prisma.analistaAsignacion.findFirst({
    where: { empresaId, activo: true, rolAsignacion: { in: ["lead", "implementacion", "marketplace", "soporte"] } },
    orderBy: { createdAt: "asc" },
  })
  if (asignacion) return asignacion.analistaEmail

  const proyecto = await prisma.proyectoImplementacion.findUnique({
    where: { empresaId },
    select: { analistaEmail: true },
  })
  if (proyecto?.analistaEmail) return proyecto.analistaEmail

  const fallback = process.env.CLAVER_MARKETPLACE_ANALISTA_FALLBACK
  return fallback ?? null
}

export async function crearTareaMarketplace(input: {
  empresaId: number
  sku: string
  nombre: string
  autoCertLevel: AutoCertLevel
  provisionJobId?: string
  prioridad?: string
}) {
  const runbook = getRunbookOrDefault(input.sku, input.nombre, input.autoCertLevel)
  const analista = await resolverAnalistaEmpresa(input.empresaId)
  const needsHuman = input.autoCertLevel === "SEMI_AUTO" || input.autoCertLevel === "HUMAN_GATE"

  const tipoEjecutor = needsHuman ? "mixto" : "ia"
  const asignadoA = needsHuman ? analista : "clav-ai"

  const checklist = runbook.pasos
    .filter((p) => p.ejecutor === "analista" || p.ejecutor === "cliente")
    .map((p) => ({ paso: p.orden, titulo: p.titulo, hecho: false, ejecutor: p.ejecutor }))

  return prisma.marketplaceTareaAnalista.create({
    data: {
      empresaId: input.empresaId,
      sku: input.sku,
      provisionJobId: input.provisionJobId,
      tipoEjecutor,
      asignadoA,
      estado: "pendiente",
      prioridad: input.prioridad ?? (needsHuman ? "alta" : "media"),
      titulo: `Activar ${input.nombre} (${input.sku})`,
      descripcion: runbook.otorgamiento,
      runbookCodigo: input.sku,
      checklistJson: checklist,
      metadata: {
        ccaFase: runbook.ccaFase,
        activacionCliente: runbook.activacionCliente,
        postventa: runbook.postventa,
        escalacionSi: runbook.escalacionSi,
        pasos: runbook.pasos as any,
      },
    },
  })
}

export async function listTareasAnalista(opts: {
  analistaEmail?: string
  empresaIds?: number[]
  estado?: string
  limit?: number
}) {
  const where: Record<string, unknown> = {}
  if (opts.estado) where.estado = opts.estado
  if (opts.empresaIds?.length) where.empresaId = { in: opts.empresaIds }
  if (opts.analistaEmail) {
    where.OR = [{ asignadoA: opts.analistaEmail }, { asignadoA: "clav-ai" }]
  }

  return prisma.marketplaceTareaAnalista.findMany({
    where,
    include: {
      empresa: { select: { id: true, nombre: true, razonSocial: true, cuit: true } },
    },
    orderBy: [{ prioridad: "desc" }, { createdAt: "desc" }],
    take: opts.limit ?? 100,
  })
}

export async function completarTarea(tareaId: string, notas?: string) {
  const tarea = await prisma.marketplaceTareaAnalista.update({
    where: { id: tareaId },
    data: {
      estado: "completada",
      completadaAt: new Date(),
      notas: notas ?? undefined,
    },
  })
  return tarea
}

export async function asegurarAsignacionAnalista(empresaId: number, analistaEmail: string, rol = "marketplace") {
  return prisma.analistaAsignacion.upsert({
    where: { analistaEmail_empresaId: { analistaEmail, empresaId } },
    create: { empresaId, analistaEmail, rolAsignacion: rol, activo: true },
    update: { activo: true, rolAsignacion: rol },
  })
}