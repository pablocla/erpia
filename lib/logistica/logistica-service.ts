/**
 * Logística Service — Shipping, transport, route management
 */

import { prisma } from "@/lib/prisma"

export class LogisticaService {
  // ─── ENVÍOS ─────────────────────────────────────────────────────────────

  async listarEnvios(empresaId: number, filters: {
    estado?: string
    transportistaId?: number
    desde?: string
    hasta?: string
  } = {}) {
    const where: Record<string, unknown> = { empresaId }
    if (filters.estado) where.estado = filters.estado
    if (filters.transportistaId) where.transportistaId = filters.transportistaId
    if (filters.desde || filters.hasta) {
      where.createdAt = {}
      if (filters.desde) (where.createdAt as Record<string, unknown>).gte = new Date(filters.desde)
      if (filters.hasta) (where.createdAt as Record<string, unknown>).lte = new Date(filters.hasta)
    }

    return prisma.envio.findMany({
      where,
      include: {
        transportista: { select: { id: true, nombre: true } },
        remito: { select: { id: true, numero: true } },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async crearEnvio(empresaId: number, data: {
    remitoId?: number
    transportistaId?: number
    direccionDestino: string
    pesoKg?: number
    bultos?: number
    observaciones?: string
  }) {
    const numero = `ENV-${Date.now()}`
    return prisma.envio.create({
      data: {
        empresaId,
        numero,
        remitoId: data.remitoId,
        transportistaId: data.transportistaId,
        direccionDestino: data.direccionDestino,
        pesoKg: data.pesoKg,
        bultos: data.bultos,
        observaciones: data.observaciones,
        estado: "pendiente",
      },
    })
  }

  async actualizarEstadoEnvio(envioId: number, estado: string) {
    const fechas: Record<string, unknown> = {}
    if (estado === "en_transito") fechas.fechaEmbarque = new Date()
    if (estado === "entregado") fechas.fechaEntrega = new Date()

    return prisma.envio.update({
      where: { id: envioId },
      data: { estado, ...fechas },
    })
  }

  // ─── TRANSPORTISTAS ───────────────────────────────────────────────────────

  async listarTransportistas(empresaId: number) {
    return prisma.transportista.findMany({
      where: { empresaId, activo: true },
      include: {
        envios: { take: 5, orderBy: { createdAt: "desc" } },
      },
      orderBy: { nombre: "asc" },
    })
  }

  async crearTransportista(empresaId: number, data: {
    nombre: string
    cuit?: string
    telefono?: string
    email?: string
  }) {
    return prisma.transportista.create({
      data: { ...data, empresaId },
    })
  }

  // ─── HOJAS DE RUTA ────────────────────────────────────────────────────────

  async listarHojasRuta(empresaId: number, filters: { fecha?: string; estado?: string } = {}) {
    const where: Record<string, unknown> = { empresaId }
    if (filters.fecha) where.fecha = new Date(filters.fecha)
    if (filters.estado) where.estado = filters.estado

    return prisma.hojaRuta.findMany({
      where,
      include: {
        chofer: { select: { id: true, nombre: true } },
        vehiculo: { select: { id: true, patente: true, marca: true, modelo: true } },
        paradas: {
          orderBy: { orden: "asc" },
          include: { cliente: { select: { id: true, nombre: true, direccion: true } } },
        },
      },
      orderBy: { fecha: "desc" },
    })
  }

  async crearHojaRuta(empresaId: number, data: {
    fecha: string
    choferId: number
    vehiculoId?: number
    observaciones?: string
    paradas: Array<{
      clienteId: number
      direccion: string
      orden: number
      envioId?: number
    }>
  }) {
    return prisma.hojaRuta.create({
      data: {
        empresaId,
        numero: `HR-${Date.now()}`,
        fecha: new Date(data.fecha),
        choferId: data.choferId,
        vehiculoId: data.vehiculoId,
        observaciones: data.observaciones,
        estado: "planificada",
        paradas: {
          create: data.paradas.map((p) => ({
            clienteId: p.clienteId,
            direccion: p.direccion,
            orden: p.orden,
            envioId: p.envioId,
            estado: "pendiente",
          })),
        },
      },
      include: { paradas: true, chofer: true, vehiculo: true },
    })
  }

  async actualizarEstadoParada(paradaId: number, estado: string) {
    const fechas: Record<string, unknown> = {}
    if (estado === "entregado" || estado === "rechazado") {
      fechas.horaLlegada = new Date().toISOString().slice(11, 16)
    }

    return prisma.paradaRuta.update({
      where: { id: paradaId },
      data: { estado, ...fechas },
    })
  }
}

export const logisticaService = new LogisticaService()
