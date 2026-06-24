/**
 * Agro Service — Módulo AGRO / ACOPIO
 *
 * Cubre:
 * - Gestión de granos (catálogo)
 * - Silos y depósitos con stock
 * - Pizarra de precios (BCR, MATBA-ROFEX, CME)
 * - Tickets de balanza (pesaje de camiones)
 * - Contratos de cereales (compra/venta)
 * - Liquidaciones a productores (con retenciones AFIP Res. 2300/07)
 * - Lotes / potreros (Agricultura 4.0)
 */

import { prisma } from "@/lib/prisma"

// ─── TIPOS ──────────────────────────────────────────────────────────────────

export interface CreateTicketDto {
  tipo: "entrada" | "salida"
  granoId: number
  proveedorId?: number
  siloId?: number
  patente?: string
  conductor?: string
  pesoBruto: number
  tara: number
  humedad?: number
  impureza?: number
  proteina?: number
  contratoId?: number
  observaciones?: string
  cartaPorteNumero?: string
}

export interface CreateContratoDto {
  tipo: "compra" | "venta"
  granoId: number
  proveedorId?: number
  clienteId?: number
  campana: string
  toneladasPactadas: number
  precioPacto?: number
  moneda?: "ARS" | "USD"
  fechaEntrega?: string
  observaciones?: string
}

export interface CreateLiquidacionDto {
  contratoId: number
  proveedorId: number
  campana: string
  toneladasLiquidadas: number
  precioUnitario: number
  descuentoCalidad?: number
  observaciones?: string
}

export interface PrecioExternoDto {
  granoId: number
  posicion: string
  precio: number
  moneda: "ARS" | "USD"
  fuente: "BCR" | "MATBA-ROFEX" | "CME" | "manual"
  variacion?: number
  fechaData?: Date
}

// ─── GRANOS ──────────────────────────────────────────────────────────────────

export const agroService = {

  // ── Granos ────────────────────────────────────────────────────────────────

  async listarGranos(empresaId: number) {
    return prisma.agroGrano.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: "asc" },
    })
  },

  async crearGrano(empresaId: number, data: { codigo: string; nombre: string; unidad?: string; iva?: number }) {
    return prisma.agroGrano.create({
      data: {
        ...data,
        empresaId,
        unidad: data.unidad ?? "tn",
        iva: data.iva ?? 10.5,
      },
    })
  },

  // ── Silos ────────────────────────────────────────────────────────────────

  async listarSilos(empresaId: number) {
    return prisma.agroSilo.findMany({
      where: { empresaId, activo: true },
      include: { grano: true },
      orderBy: { nombre: "asc" },
    })
  },

  async stockPorGrano(empresaId: number) {
    const silos = await prisma.agroSilo.findMany({
      where: { empresaId, activo: true },
      include: { grano: true },
    })
    const mapa: Record<string, { nombre: string; totalTn: number; capacidadTn: number }> = {}
    for (const s of silos) {
      const key = s.grano?.nombre ?? "Sin clasificar"
      if (!mapa[key]) mapa[key] = { nombre: key, totalTn: 0, capacidadTn: 0 }
      mapa[key].totalTn += s.stockActualTn
      mapa[key].capacidadTn += s.capacidadTn
    }
    return Object.values(mapa)
  },

  // ── Pizarra de Precios ────────────────────────────────────────────────────

  /** Última pizarra por grano (para el widget del dashboard) */
  async pizarraActual(empresaId: number) {
    const granos = await prisma.agroGrano.findMany({ where: { empresaId, activo: true } })
    const result = await Promise.all(
      granos.map(async (g) => {
        const ultimo = await prisma.agroPrecioPizarra.findFirst({
          where: { empresaId, granoId: g.id },
          orderBy: { fechaData: "desc" },
        })
        return {
          granoId: g.id,
          nombre: g.nombre,
          codigo: g.codigo,
          precio: ultimo?.precio ?? null,
          moneda: ultimo?.moneda ?? "ARS",
          fuente: ultimo?.fuente ?? null,
          variacion: ultimo?.variacion ?? null,
          fechaData: ultimo?.fechaData ?? null,
        }
      })
    )
    return result
  },

  /** Guardar precio pizarra (llamado por cron o manualmente) */
  async guardarPrecio(empresaId: number, dto: PrecioExternoDto) {
    return prisma.agroPrecioPizarra.create({
      data: {
        empresaId,
        granoId: dto.granoId,
        posicion: dto.posicion,
        precio: dto.precio,
        moneda: dto.moneda,
        fuente: dto.fuente,
        variacion: dto.variacion ?? null,
        fechaData: dto.fechaData ?? new Date(),
      },
    })
  },

  /** Historial de precios de un grano (para gráfico) */
  async historialPrecios(empresaId: number, granoId: number, dias = 30) {
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)
    return prisma.agroPrecioPizarra.findMany({
      where: { empresaId, granoId, fechaData: { gte: desde } },
      orderBy: { fechaData: "asc" },
    })
  },

  // ── Tickets de Balanza ───────────────────────────────────────────────────

  async listarTickets(empresaId: number, params: { page?: number; limit?: number; granoId?: number; tipo?: string; desde?: string; hasta?: string }) {
    const page = params.page ?? 1
    const limit = params.limit ?? 50
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = { empresaId }
    if (params.granoId) where.granoId = params.granoId
    if (params.tipo) where.tipo = params.tipo
    if (params.desde || params.hasta) {
      where.fecha = {}
      if (params.desde) (where.fecha as Record<string, unknown>).gte = new Date(params.desde)
      if (params.hasta) (where.fecha as Record<string, unknown>).lte = new Date(params.hasta)
    }
    const [tickets, total] = await Promise.all([
      prisma.agroTicketBalanza.findMany({
        where,
        include: { grano: true, proveedor: true, silo: true },
        orderBy: { fecha: "desc" },
        skip,
        take: limit,
      }),
      prisma.agroTicketBalanza.count({ where }),
    ])
    return { tickets, total, page, pages: Math.ceil(total / limit) }
  },

  async crearTicket(empresaId: number, dto: CreateTicketDto) {
    // Calcular peso neto
    const pesoNeto = dto.pesoBruto - dto.tara

    // Factor de calidad por humedad e impureza (simplificado)
    let factorCalidad = 1.0
    if (dto.humedad && dto.humedad > 13.5) {
      factorCalidad -= (dto.humedad - 13.5) * 0.01
    }
    if (dto.impureza && dto.impureza > 2) {
      factorCalidad -= (dto.impureza - 2) * 0.01
    }
    factorCalidad = Math.max(0.8, factorCalidad)

    return prisma.$transaction(async (tx) => {
      // Número correlativo
      const ultimo = await tx.agroTicketBalanza.findFirst({
        where: { empresaId },
        orderBy: { createdAt: "desc" },
        select: { numero: true },
      })
      const numero = String(Number(ultimo?.numero ?? "0") + 1).padStart(6, "0")

      const ticket = await tx.agroTicketBalanza.create({
        data: {
          empresaId,
          numero,
          tipo: dto.tipo,
          granoId: dto.granoId,
          proveedorId: dto.proveedorId ?? null,
          siloId: dto.siloId ?? null,
          patente: dto.patente ?? null,
          conductor: dto.conductor ?? null,
          pesoBruto: dto.pesoBruto,
          tara: dto.tara,
          pesoNeto,
          humedad: dto.humedad ?? null,
          impureza: dto.impureza ?? null,
          proteina: dto.proteina ?? null,
          factorCalidad,
          contratoId: dto.contratoId ?? null,
          cartaPorteNumero: dto.cartaPorteNumero ?? null,
          observaciones: dto.observaciones ?? null,
          estado: "confirmado",
        },
        include: { grano: true, proveedor: true, silo: true },
      })

      // Actualizar stock del silo
      if (dto.siloId) {
        const deltaKg = dto.tipo === "entrada" ? pesoNeto : -pesoNeto
        const deltaTn = deltaKg / 1000
        await tx.agroSilo.update({
          where: { id: dto.siloId },
          data: { stockActualTn: { increment: deltaTn } },
        })
      }

      // Actualizar toneladas entregadas en contrato
      if (dto.contratoId && dto.tipo === "entrada") {
        await tx.agroContrato.update({
          where: { id: dto.contratoId },
          data: { toneladasEntregadas: { increment: pesoNeto / 1000 } },
        })
      }

      return ticket
    })
  },

  // ── Contratos ────────────────────────────────────────────────────────────

  async listarContratos(empresaId: number, params: { tipo?: string; estado?: string; campana?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1
    const limit = params.limit ?? 50
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = { empresaId }
    if (params.tipo) where.tipo = params.tipo
    if (params.estado) where.estado = params.estado
    if (params.campana) where.campana = params.campana
    const [contratos, total] = await Promise.all([
      prisma.agroContrato.findMany({
        where,
        include: { grano: true, proveedor: true, cliente: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.agroContrato.count({ where }),
    ])
    return { contratos, total, page, pages: Math.ceil(total / limit) }
  },

  async crearContrato(empresaId: number, dto: CreateContratoDto) {
    // Número correlativo
    const ultimo = await prisma.agroContrato.findFirst({
      where: { empresaId },
      orderBy: { createdAt: "desc" },
      select: { numero: true },
    })
    const numero = `CTR-${new Date().getFullYear()}-${String(Number((ultimo?.numero?.split("-")[2]) ?? "0") + 1).padStart(4, "0")}`

    return prisma.agroContrato.create({
      data: {
        empresaId,
        numero,
        tipo: dto.tipo,
        granoId: dto.granoId,
        proveedorId: dto.proveedorId ?? null,
        clienteId: dto.clienteId ?? null,
        campana: dto.campana,
        toneladasPactadas: dto.toneladasPactadas,
        precioPacto: dto.precioPacto ?? null,
        moneda: dto.moneda ?? "ARS",
        fechaEntrega: dto.fechaEntrega ? new Date(dto.fechaEntrega) : null,
        observaciones: dto.observaciones ?? null,
      },
      include: { grano: true, proveedor: true, cliente: true },
    })
  },

  // ── Liquidaciones ────────────────────────────────────────────────────────

  /**
   * Calcula liquidación al productor con retenciones AFIP Res. 2300/07
   * Escala simplificada (actualizar según RG vigentes):
   *   - Hasta $100.000: 0%
   *   - $100.001 - $500.000: 10%
   *   - +$500.001: 15%
   */
  calcularRetenciones(importeBruto: number): { retencionGanancias: number; percepcionIva: number } {
    let retencionGanancias = 0
    if (importeBruto > 500000) {
      retencionGanancias = importeBruto * 0.15
    } else if (importeBruto > 100000) {
      retencionGanancias = importeBruto * 0.10
    }
    // Percepción IVA: 1% sobre compra a responsable inscripto (simplificado)
    const percepcionIva = importeBruto * 0.01
    return { retencionGanancias, percepcionIva }
  },

  async crearLiquidacion(empresaId: number, dto: CreateLiquidacionDto) {
    const importeBruto = dto.toneladasLiquidadas * dto.precioUnitario
    const descuento = dto.descuentoCalidad ?? 0
    const { retencionGanancias, percepcionIva } = this.calcularRetenciones(importeBruto)
    const importeNeto = importeBruto - descuento - retencionGanancias - percepcionIva

    const ultimo = await prisma.agroLiquidacion.findFirst({
      where: { empresaId },
      orderBy: { createdAt: "desc" },
      select: { numero: true },
    })
    const numero = `LIQ-${new Date().getFullYear()}-${String(Number((ultimo?.numero?.split("-")[2]) ?? "0") + 1).padStart(4, "0")}`

    return prisma.agroLiquidacion.create({
      data: {
        empresaId,
        numero,
        contratoId: dto.contratoId,
        proveedorId: dto.proveedorId,
        campana: dto.campana,
        toneladasLiquidadas: dto.toneladasLiquidadas,
        precioUnitario: dto.precioUnitario,
        importeBruto,
        descuentoCalidad: descuento,
        retencionGanancias,
        percepcionIva,
        importeNeto,
        observaciones: dto.observaciones ?? null,
      },
      include: { proveedor: true, contrato: { include: { grano: true } } },
    })
  },

  async listarLiquidaciones(empresaId: number, params: { estado?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1
    const limit = params.limit ?? 50
    const skip = (page - 1) * limit
    const where: Record<string, unknown> = { empresaId }
    if (params.estado) where.estado = params.estado
    const [liquidaciones, total] = await Promise.all([
      prisma.agroLiquidacion.findMany({
        where,
        include: { proveedor: true, contrato: { include: { grano: true } } },
        orderBy: { fechaEmision: "desc" },
        skip,
        take: limit,
      }),
      prisma.agroLiquidacion.count({ where }),
    ])
    return { liquidaciones, total, page, pages: Math.ceil(total / limit) }
  },

  // ── Lotes (Agricultura 4.0) ──────────────────────────────────────────────

  async listarLotes(empresaId: number) {
    return prisma.agroLote.findMany({
      where: { empresaId, activo: true },
      include: { proveedor: true },
      orderBy: { nombre: "asc" },
    })
  },

  async crearLote(empresaId: number, data: {
    nombre: string
    superficieHa: number
    geoJson?: object
    lat?: number
    lon?: number
    cultivoActual?: string
    campana?: string
    renspaProductor?: string
    proveedorId?: number
  }) {
    return prisma.agroLote.create({
      data: {
        empresaId,
        nombre: data.nombre,
        superficieHa: data.superficieHa,
        geoJson: data.geoJson ? data.geoJson : undefined,
        lat: data.lat ?? null,
        lon: data.lon ?? null,
        cultivoActual: data.cultivoActual ?? null,
        campana: data.campana ?? null,
        renspaProductor: data.renspaProductor ?? null,
        proveedorId: data.proveedorId ?? null,
      },
    })
  },

  // ── Dashboard AGRO ──────────────────────────────────────────────────────

  async resumenDashboard(empresaId: number) {
    const hoy = new Date()
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const finHoy = new Date(inicioHoy.getTime() + 86400000)

    const [
      stockPorGrano,
      camionesHoy,
      liquidacionesPendientes,
      contratosPendientes,
      pizarra,
    ] = await Promise.all([
      this.stockPorGrano(empresaId),
      prisma.agroTicketBalanza.count({ where: { empresaId, fecha: { gte: inicioHoy, lt: finHoy } } }),
      prisma.agroLiquidacion.count({ where: { empresaId, estado: "pendiente" } }),
      prisma.agroContrato.count({ where: { empresaId, estado: { in: ["abierto", "parcial"] } } }),
      this.pizarraActual(empresaId),
    ])

    // Tn ingresadas hoy
    const tnHoy = await prisma.agroTicketBalanza.aggregate({
      where: { empresaId, tipo: "entrada", fecha: { gte: inicioHoy, lt: finHoy }, estado: "confirmado" },
      _sum: { pesoNeto: true },
    })

    return {
      stockPorGrano,
      camionesHoy,
      tnIngresadasHoy: (tnHoy._sum.pesoNeto ?? 0) / 1000, // kg → tn
      liquidacionesPendientes,
      contratosPendientes,
      pizarra,
    }
  },
}
