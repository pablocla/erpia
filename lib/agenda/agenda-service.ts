/**
 * Agenda Service — Appointment scheduling
 */

import { prisma } from "@/lib/prisma"

export class AgendaService {
  async listarTurnos(empresaId: number, filters: {
    fecha?: string
    profesionalId?: number
    estado?: string
    clienteId?: number
  } = {}) {
    const where: Record<string, unknown> = { profesional: { empresaId } }
    if (filters.fecha) where.fecha = new Date(filters.fecha)
    if (filters.profesionalId) where.profesionalId = filters.profesionalId
    if (filters.estado) where.estado = filters.estado
    if (filters.clienteId) where.clienteId = filters.clienteId

    return prisma.turno.findMany({
      where,
      include: {
        profesional: { select: { id: true, nombre: true, especialidad: true, color: true } },
        cliente: { select: { id: true, nombre: true, telefono: true, email: true } },
      },
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
    })
  }

  async obtenerTurno(turnoId: number) {
    return prisma.turno.findUnique({
      where: { id: turnoId },
      include: {
        profesional: true,
        cliente: true,
      },
    })
  }

  async crearTurno(data: {
    fecha: string
    horaInicio: string
    horaFin: string
    profesionalId: number
    clienteId?: number
    motivo?: string
    notas?: string
  }) {
    // Check for conflicts
    const conflicto = await prisma.turno.findFirst({
      where: {
        profesionalId: data.profesionalId,
        fecha: new Date(data.fecha),
        estado: { notIn: ["cancelado", "no_asistio"] },
        OR: [
          { horaInicio: { gte: data.horaInicio, lt: data.horaFin } },
          { horaFin: { gt: data.horaInicio, lte: data.horaFin } },
        ],
      },
    })
    if (conflicto) {
      throw new Error("TURNO_SUPERPUESTO")
    }

    return prisma.turno.create({
      data: {
        fecha: new Date(data.fecha),
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        profesionalId: data.profesionalId,
        clienteId: data.clienteId,
        motivo: data.motivo,
        notas: data.notas,
      },
      include: {
        profesional: { select: { id: true, nombre: true, especialidad: true } },
        cliente: { select: { id: true, nombre: true } },
      },
    })
  }

  async actualizarTurno(turnoId: number, data: {
    estado?: string
    horaInicio?: string
    horaFin?: string
    motivo?: string
    notas?: string
  }) {
    return prisma.turno.update({
      where: { id: turnoId },
      data: {
        ...(data.estado && { estado: data.estado }),
        ...(data.horaInicio && { horaInicio: data.horaInicio }),
        ...(data.horaFin && { horaFin: data.horaFin }),
        ...(data.motivo !== undefined && { motivo: data.motivo }),
        ...(data.notas !== undefined && { notas: data.notas }),
      },
      include: { profesional: true, cliente: true },
    })
  }

  async cancelarTurno(turnoId: number) {
    return prisma.turno.update({
      where: { id: turnoId },
      data: { estado: "cancelado" },
    })
  }

  async listarProfesionales(empresaId: number) {
    return prisma.profesional.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: "asc" },
    })
  }

  async resumenDia(empresaId: number, fecha: Date) {
    const turnos = await prisma.turno.findMany({
      where: {
        fecha,
        profesional: { empresaId },
      },
    })

    return {
      total: turnos.length,
      pendientes: turnos.filter((t) => t.estado === "pendiente").length,
      confirmados: turnos.filter((t) => t.estado === "confirmado").length,
      completados: turnos.filter((t) => t.estado === "completado").length,
      cancelados: turnos.filter((t) => t.estado === "cancelado").length,
      noAsistieron: turnos.filter((t) => t.estado === "no_asistio").length,
    }
  }
}

export const agendaService = new AgendaService()
