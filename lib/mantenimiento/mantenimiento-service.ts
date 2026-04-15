/**
 * Mantenimiento Preventivo Service
 *
 * Planes de mantenimiento, órdenes de trabajo, tracking de activos.
 * Relevante para industria/manufactura/flota vehicular.
 */

import { prisma } from "@/lib/prisma"

export interface CrearPlanInput {
  empresaId: number
  nombre: string
  descripcion?: string
  frecuencia: string
  proximaEjecucion: Date
  activoFijoId?: number
  equipo?: string
  responsable?: string
  costoEstimado?: number
}

export async function crearPlanMantenimiento(input: CrearPlanInput) {
  return prisma.planMantenimiento.create({
    data: {
      nombre: input.nombre,
      descripcion: input.descripcion,
      frecuencia: input.frecuencia,
      proximaEjecucion: input.proximaEjecucion,
      activoFijoId: input.activoFijoId,
      equipo: input.equipo,
      responsable: input.responsable,
      costoEstimado: input.costoEstimado,
      empresaId: input.empresaId,
    },
  })
}

export async function listarPlanesMantenimiento(empresaId: number) {
  return prisma.planMantenimiento.findMany({
    where: { empresaId, activo: true },
    include: { ordenesTrabajo: { take: 3, orderBy: { createdAt: "desc" } } },
    orderBy: { proximaEjecucion: "asc" },
  })
}

export async function crearOrdenTrabajo(
  empresaId: number,
  data: {
    planId?: number
    tipo?: string
    descripcion: string
    prioridad?: string
    fechaProgramada: Date
    tecnicoAsignado?: string
  },
) {
  // Generar número correlativo
  const ultimaOT = await prisma.ordenTrabajo.findFirst({
    where: { empresaId },
    orderBy: { createdAt: "desc" },
  })
  const numero = `OT-${String((ultimaOT ? parseInt(ultimaOT.numero.replace("OT-", "")) : 0) + 1).padStart(6, "0")}`

  return prisma.ordenTrabajo.create({
    data: {
      numero,
      tipo: data.tipo ?? "preventivo",
      descripcion: data.descripcion,
      prioridad: data.prioridad ?? "media",
      fechaProgramada: data.fechaProgramada,
      tecnicoAsignado: data.tecnicoAsignado,
      planId: data.planId,
      empresaId,
    },
  })
}

export async function actualizarOrdenTrabajo(
  empresaId: number,
  ordenId: number,
  data: {
    estado?: string
    fechaInicio?: Date
    fechaFin?: Date
    observaciones?: string
    costoManoObra?: number
    costoRepuestos?: number
    tecnicoAsignado?: string
  },
) {
  return prisma.ordenTrabajo.update({
    where: { id: ordenId },
    data,
  })
}

export async function listarOrdenesTrabajo(
  empresaId: number,
  filtros?: { estado?: string; prioridad?: string },
) {
  return prisma.ordenTrabajo.findMany({
    where: {
      empresaId,
      ...(filtros?.estado ? { estado: filtros.estado } : {}),
      ...(filtros?.prioridad ? { prioridad: filtros.prioridad } : {}),
    },
    include: { plan: { select: { nombre: true, equipo: true } } },
    orderBy: { fechaProgramada: "asc" },
  })
}

/**
 * Verifica planes que requieren generar OT y las crea automáticamente.
 * Diseñado para cron diario.
 */
export async function generarOTsPreventivas(empresaId: number) {
  const hoy = new Date()
  hoy.setHours(23, 59, 59, 999)

  const planesVencidos = await prisma.planMantenimiento.findMany({
    where: {
      empresaId,
      activo: true,
      proximaEjecucion: { lte: hoy },
    },
  })

  const otGeneradas: string[] = []

  for (const plan of planesVencidos) {
    const ot = await crearOrdenTrabajo(empresaId, {
      planId: plan.id,
      tipo: "preventivo",
      descripcion: `${plan.nombre}${plan.descripcion ? ` — ${plan.descripcion}` : ""}`,
      prioridad: "media",
      fechaProgramada: plan.proximaEjecucion,
      tecnicoAsignado: plan.responsable,
    })

    // Calcular próxima ejecución
    const proxima = new Date(plan.proximaEjecucion)
    switch (plan.frecuencia) {
      case "diario": proxima.setDate(proxima.getDate() + 1); break
      case "semanal": proxima.setDate(proxima.getDate() + 7); break
      case "mensual": proxima.setMonth(proxima.getMonth() + 1); break
      case "trimestral": proxima.setMonth(proxima.getMonth() + 3); break
      case "semestral": proxima.setMonth(proxima.getMonth() + 6); break
      case "anual": proxima.setFullYear(proxima.getFullYear() + 1); break
    }

    await prisma.planMantenimiento.update({
      where: { id: plan.id },
      data: { proximaEjecucion: proxima },
    })

    otGeneradas.push(ot.numero)
  }

  return { generadas: otGeneradas.length, ordenes: otGeneradas }
}

export async function resumenMantenimiento(empresaId: number) {
  const [pendientes, enProceso, completadas, planesActivos] = await Promise.all([
    prisma.ordenTrabajo.count({ where: { empresaId, estado: "pendiente" } }),
    prisma.ordenTrabajo.count({ where: { empresaId, estado: "en_proceso" } }),
    prisma.ordenTrabajo.count({ where: { empresaId, estado: "completada" } }),
    prisma.planMantenimiento.count({ where: { empresaId, activo: true } }),
  ])

  // Próximas 5 OT
  const proximas = await prisma.ordenTrabajo.findMany({
    where: { empresaId, estado: { in: ["pendiente", "en_proceso"] } },
    include: { plan: { select: { nombre: true, equipo: true } } },
    orderBy: { fechaProgramada: "asc" },
    take: 5,
  })

  return { pendientes, enProceso, completadas, planesActivos, proximas }
}
