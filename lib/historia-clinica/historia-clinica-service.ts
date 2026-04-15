/**
 * Historia Clínica Service — Medical records (Veterinary / Health)
 */

import { prisma } from "@/lib/prisma"

export class HistoriaClinicaService {
  async listarPacientes(empresaId: number, filters: {
    clienteId?: number
    search?: string
    especie?: string
  } = {}) {
    const where: Record<string, unknown> = {
      cliente: { empresaId },
      activo: true,
    }
    if (filters.clienteId) where.clienteId = filters.clienteId
    if (filters.especie) where.especie = filters.especie
    if (filters.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: "insensitive" } },
        { chip: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    return prisma.paciente.findMany({
      where,
      include: {
        cliente: { select: { id: true, nombre: true, telefono: true } },
        _count: { select: { consultas: true } },
      },
      orderBy: { nombre: "asc" },
    })
  }

  async obtenerPaciente(pacienteId: number) {
    return prisma.paciente.findUnique({
      where: { id: pacienteId },
      include: {
        cliente: true,
        consultas: {
          orderBy: { fecha: "desc" },
          take: 20,
        },
      },
    })
  }

  async crearPaciente(data: {
    nombre: string
    clienteId: number
    especie?: string
    raza?: string
    sexo?: string
    fechaNac?: string
    peso?: number
    chip?: string
    notas?: string
  }) {
    return prisma.paciente.create({
      data: {
        nombre: data.nombre,
        clienteId: data.clienteId,
        especie: data.especie,
        raza: data.raza,
        sexo: data.sexo,
        fechaNac: data.fechaNac ? new Date(data.fechaNac) : undefined,
        peso: data.peso,
        chip: data.chip,
        notas: data.notas,
      },
      include: { cliente: { select: { id: true, nombre: true } } },
    })
  }

  async actualizarPaciente(pacienteId: number, data: Partial<{
    nombre: string
    especie: string
    raza: string
    sexo: string
    peso: number
    notas: string
    activo: boolean
  }>) {
    return prisma.paciente.update({
      where: { id: pacienteId },
      data,
    })
  }

  async registrarConsulta(data: {
    pacienteId: number
    motivo: string
    diagnostico?: string
    tratamiento?: string
    observaciones?: string
    peso?: number
    temperatura?: number
    proximaVisita?: string
  }) {
    const consulta = await prisma.consulta.create({
      data: {
        pacienteId: data.pacienteId,
        motivo: data.motivo,
        diagnostico: data.diagnostico,
        tratamiento: data.tratamiento,
        observaciones: data.observaciones,
        peso: data.peso,
        temperatura: data.temperatura,
        proximaVisita: data.proximaVisita ? new Date(data.proximaVisita) : undefined,
      },
    })

    // Update patient weight if provided
    if (data.peso) {
      await prisma.paciente.update({
        where: { id: data.pacienteId },
        data: { peso: data.peso },
      })
    }

    return consulta
  }

  async listarConsultas(pacienteId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [consultas, total] = await Promise.all([
      prisma.consulta.findMany({
        where: { pacienteId },
        orderBy: { fecha: "desc" },
        skip,
        take: limit,
      }),
      prisma.consulta.count({ where: { pacienteId } }),
    ])

    return { consultas, total, page, limit }
  }
}

export const historiaClinicaService = new HistoriaClinicaService()
