/**
 * Membresías Service — Subscription / membership management
 */

import { prisma } from "@/lib/prisma"

export class MembresiasService {
  async listarPlanes(empresaId: number) {
    return prisma.planMembresia.findMany({
      where: { empresaId, activo: true },
      include: { _count: { select: { membresias: true } } },
      orderBy: { precio: "asc" },
    })
  }

  async crearPlan(empresaId: number, data: {
    nombre: string
    descripcion?: string
    precio: number
    periodicidad?: string
    duracionDias?: number
  }) {
    return prisma.planMembresia.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        periodicidad: data.periodicidad ?? "mensual",
        duracionDias: data.duracionDias ?? 30,
        empresaId,
      },
    })
  }

  async listarMembresias(empresaId: number, filters: {
    estado?: string
    clienteId?: number
    planId?: number
  } = {}) {
    const where: Record<string, unknown> = { plan: { empresaId } }
    if (filters.estado) where.estado = filters.estado
    if (filters.clienteId) where.clienteId = filters.clienteId
    if (filters.planId) where.planId = filters.planId

    return prisma.membresia.findMany({
      where,
      include: {
        plan: { select: { id: true, nombre: true, precio: true, periodicidad: true } },
        cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
      },
      orderBy: { fechaInicio: "desc" },
    })
  }

  async crearMembresia(data: {
    planId: number
    clienteId: number
    fechaInicio: string
  }) {
    const plan = await prisma.planMembresia.findUnique({ where: { id: data.planId } })
    if (!plan) throw new Error("PLAN_NO_ENCONTRADO")

    const fechaInicio = new Date(data.fechaInicio)
    const fechaFin = new Date(fechaInicio)
    fechaFin.setDate(fechaFin.getDate() + plan.duracionDias)

    return prisma.membresia.create({
      data: {
        planId: data.planId,
        clienteId: data.clienteId,
        fechaInicio,
        fechaFin,
        estado: "activa",
      },
      include: { plan: true, cliente: { select: { id: true, nombre: true } } },
    })
  }

  async renovarMembresia(membresiaId: number) {
    const membresia = await prisma.membresia.findUnique({
      where: { id: membresiaId },
      include: { plan: true },
    })
    if (!membresia) throw new Error("MEMBRESIA_NO_ENCONTRADA")

    const nuevaFechaInicio = new Date(membresia.fechaFin)
    const nuevaFechaFin = new Date(nuevaFechaInicio)
    nuevaFechaFin.setDate(nuevaFechaFin.getDate() + membresia.plan.duracionDias)

    // Extend existing membership
    return prisma.membresia.update({
      where: { id: membresiaId },
      data: {
        fechaFin: nuevaFechaFin,
        estado: "activa",
      },
    })
  }

  async suspenderMembresia(membresiaId: number) {
    return prisma.membresia.update({
      where: { id: membresiaId },
      data: { estado: "suspendida" },
    })
  }

  async cancelarMembresia(membresiaId: number) {
    return prisma.membresia.update({
      where: { id: membresiaId },
      data: { estado: "cancelada" },
    })
  }

  async verificarVencidas(empresaId: number) {
    const hoy = new Date()
    return prisma.membresia.updateMany({
      where: {
        plan: { empresaId },
        estado: "activa",
        fechaFin: { lt: hoy },
      },
      data: { estado: "vencida" },
    })
  }

  async resumen(empresaId: number) {
    const [activas, vencidas, canceladas, planes] = await Promise.all([
      prisma.membresia.count({ where: { plan: { empresaId }, estado: "activa" } }),
      prisma.membresia.count({ where: { plan: { empresaId }, estado: "vencida" } }),
      prisma.membresia.count({ where: { plan: { empresaId }, estado: "cancelada" } }),
      prisma.planMembresia.count({ where: { empresaId, activo: true } }),
    ])

    return { activas, vencidas, canceladas, totalPlanes: planes }
  }
}

export const membresiasService = new MembresiasService()
