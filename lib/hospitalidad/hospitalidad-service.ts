/**
 * Hospitalidad Service — Restaurant / Salon management
 * 
 * Provides business logic for: Salones, Mesas, Comandas, KDS,
 * menu (platos/recetas), and table-to-invoice flow.
 */

import { prisma } from "@/lib/prisma"
import { eventBus } from "@/lib/events/event-bus"

export class HospitalidadService {
  // ─── SALONES ──────────────────────────────────────────────────────────────

  async listarSalones(empresaId: number) {
    return prisma.salon.findMany({
      where: { empresaId },
      include: {
        mesas: {
          select: { id: true, numero: true, capacidad: true, estado: true },
          orderBy: { numero: "asc" },
        },
        _count: { select: { mesas: true } },
      },
      orderBy: { nombre: "asc" },
    })
  }

  async crearSalon(empresaId: number, data: { nombre: string }) {
    return prisma.salon.create({
      data: { nombre: data.nombre, empresaId },
      include: { _count: { select: { mesas: true } } },
    })
  }

  // ─── MESAS ────────────────────────────────────────────────────────────────

  async listarMesas(empresaId: number, salonId?: number) {
    const where: Record<string, unknown> = { salon: { empresaId } }
    if (salonId) where.salonId = salonId

    return prisma.mesa.findMany({
      where,
      include: {
        salon: { select: { id: true, nombre: true } },
        comandas: {
          where: { estado: { notIn: ["cerrada", "cancelada"] } },
          include: { lineas: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { numero: "asc" },
    })
  }

  async crearMesa(salonId: number, data: { numero: number; capacidad?: number; posX?: number; posY?: number }) {
    return prisma.mesa.create({
      data: {
        salonId,
        numero: data.numero,
        capacidad: data.capacidad ?? 4,
        posX: data.posX,
        posY: data.posY,
      },
    })
  }

  async actualizarEstadoMesa(mesaId: number, estado: string) {
    return prisma.mesa.update({
      where: { id: mesaId },
      data: { estado },
    })
  }

  // ─── COMANDAS ─────────────────────────────────────────────────────────────

  async obtenerComanda(comandaId: number) {
    return prisma.comanda.findUnique({
      where: { id: comandaId },
      include: {
        mesa: { select: { id: true, numero: true, salon: { select: { nombre: true } } } },
        lineas: {
          include: { producto: { select: { id: true, nombre: true } } },
        },
        factura: { select: { id: true, numero: true, total: true } },
      },
    })
  }

  async actualizarEstadoComanda(comandaId: number, estado: string) {
    const comanda = await prisma.$transaction(async (tx) => {
      const updated = await tx.comanda.update({
        where: { id: comandaId },
        data: { estado },
        include: { lineas: true, mesa: true },
      })

      // Free table when closing
      if (estado === "cerrada" || estado === "cancelada") {
        const otrasAbiertas = await tx.comanda.count({
          where: {
            mesaId: updated.mesaId,
            id: { not: comandaId },
            estado: { notIn: ["cerrada", "cancelada"] },
          },
        })
        if (otrasAbiertas === 0) {
          await tx.mesa.update({ where: { id: updated.mesaId }, data: { estado: "libre" } })
        }
      }

      return updated
    })

    return comanda
  }

  async actualizarEstadoLinea(lineaId: number, estado: string) {
    return prisma.lineaComanda.update({
      where: { id: lineaId },
      data: { estado },
    })
  }

  // ─── KDS (Kitchen Display System) ─────────────────────────────────────────

  async obtenerComandasCocina(empresaId: number) {
    return prisma.comanda.findMany({
      where: {
        estado: { in: ["enviada_cocina", "en_preparacion"] },
        mesa: { salon: { empresaId } },
      },
      include: {
        mesa: { select: { numero: true, salon: { select: { nombre: true } } } },
        lineas: {
          where: { estado: { in: ["pendiente", "en_preparacion"] } },
          include: { producto: { select: { nombre: true } } },
        },
      },
      orderBy: { createdAt: "asc" },
    })
  }

  async marcarLineaLista(lineaId: number) {
    const linea = await prisma.lineaComanda.update({
      where: { id: lineaId },
      data: { estado: "lista" },
      include: { comanda: { include: { lineas: true } } },
    })

    // If all lines are ready, mark comanda as ready
    const todasListas = linea.comanda.lineas.every(
      (l) => l.id === lineaId || l.estado === "lista" || l.estado === "entregada",
    )
    if (todasListas) {
      await prisma.comanda.update({
        where: { id: linea.comandaId },
        data: { estado: "lista" },
      })
    }

    return linea
  }

  // ─── FACTURACIÓN DE MESA ──────────────────────────────────────────────────

  async obtenerCuentaMesa(mesaId: number) {
    const comandas = await prisma.comanda.findMany({
      where: { mesaId, estado: { notIn: ["cancelada", "cerrada"] } },
      include: { lineas: true },
    })

    const lineas = comandas.flatMap((c) => c.lineas)
    const subtotal = lineas.reduce((sum, l) => sum + Number(l.precio) * l.cantidad, 0)
    const iva = subtotal * 0.21
    const total = subtotal + iva

    return {
      mesaId,
      comandas: comandas.map((c) => c.id),
      lineas,
      subtotal,
      iva,
      total,
    }
  }
}

export const hospitalidadService = new HospitalidadService()
