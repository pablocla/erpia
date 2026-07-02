/**
 * Cannabis Service — Trazabilidad ONG / cultivo medicinal
 *
 * Cubre:
 * - Perfil REPROCANN y cupos
 * - Salas / invernaderos
 * - Genéticas autorizadas
 * - Ciclos de cultivo (germinación → cosecha)
 * - Insumos (fertilizantes, químicos, sustrato)
 * - Aplicaciones con costo y descuento de stock
 * - Análisis de suelo / sustrato / agua
 * - Cosechas y rendimiento
 */

import { prisma } from "@/lib/prisma"

export const ETAPAS_CICLO = [
  "GERMINACION",
  "VEGETATIVO",
  "FLORACION",
  "SECADO",
  "CURADO",
  "FINALIZADO",
] as const

export type EtapaCiclo = (typeof ETAPAS_CICLO)[number]

export const CATEGORIAS_INSUMO = [
  "FERTILIZANTE",
  "QUIMICO",
  "SUSTRATO",
  "SEMILLA",
  "NUTRIENTE",
  "OTRO",
] as const

export type CategoriaInsumo = (typeof CATEGORIAS_INSUMO)[number]

export interface CreateSalaDto {
  nombre: string
  tipo?: string
  superficieM2?: number
  capacidadPlantas?: number
  loteId?: number
}

export interface CreateGeneticaDto {
  nombre: string
  tipo?: string
  thcMaxPct?: number
  cbdMaxPct?: number
  reprocannAutorizada?: boolean
  notas?: string
}

export interface CreateCicloDto {
  salaId: number
  geneticaId: number
  plantasIniciales: number
  etapa?: EtapaCiclo
  observaciones?: string
}

export interface CreateInsumoDto {
  codigo: string
  nombre: string
  categoria: CategoriaInsumo
  unidad?: string
  stockActual?: number
  stockMinimo?: number
  costoUnitario?: number
  proveedorId?: number
  fichaSeguridad?: string
  composicion?: string
}

export interface CreateAplicacionDto {
  cicloId: number
  insumoId: number
  cantidad: number
  unidad?: string
  dosis?: string
  operador?: string
  metodo?: string
  observaciones?: string
  fecha?: string
}

export interface CreateAnalisisSueloDto {
  cicloId?: number
  salaId?: number
  tipoMuestra?: string
  ph?: number
  ec?: number
  nitrogeno?: number
  fosforo?: number
  potasio?: number
  humedad?: number
  costoAnalisis?: number
  laboratorio?: string
  notas?: string
  fecha?: string
}

export interface CreateCosechaDto {
  cicloId: number
  plantasCosechadas: number
  pesoHumedoKg?: number
  pesoSecoKg?: number
  destino?: string
  loteTrazabilidad?: string
  observaciones?: string
  fecha?: string
}

export interface UpdatePerfilDto {
  nombreOng?: string
  reprocannNumero?: string
  reprocannVencimiento?: string
  cupoPlantas?: number
  cupoSuperficieM2?: number
  responsableTecnico?: string
  observaciones?: string
}

function siguienteNumeroCiclo(ultimo: string | undefined): string {
  const year = new Date().getFullYear()
  const seq = Number((ultimo?.split("-")[2]) ?? "0") + 1
  return `CIC-${year}-${String(seq).padStart(4, "0")}`
}

export const cannabisService = {
  async obtenerPerfil(empresaId: number) {
    return prisma.agroCannabisPerfil.findUnique({ where: { empresaId } })
  },

  async guardarPerfil(empresaId: number, dto: UpdatePerfilDto) {
    return prisma.agroCannabisPerfil.upsert({
      where: { empresaId },
      create: {
        empresaId,
        nombreOng: dto.nombreOng ?? null,
        reprocannNumero: dto.reprocannNumero ?? null,
        reprocannVencimiento: dto.reprocannVencimiento ? new Date(dto.reprocannVencimiento) : null,
        cupoPlantas: dto.cupoPlantas ?? null,
        cupoSuperficieM2: dto.cupoSuperficieM2 ?? null,
        responsableTecnico: dto.responsableTecnico ?? null,
        observaciones: dto.observaciones ?? null,
      },
      update: {
        nombreOng: dto.nombreOng,
        reprocannNumero: dto.reprocannNumero,
        reprocannVencimiento: dto.reprocannVencimiento ? new Date(dto.reprocannVencimiento) : undefined,
        cupoPlantas: dto.cupoPlantas,
        cupoSuperficieM2: dto.cupoSuperficieM2,
        responsableTecnico: dto.responsableTecnico,
        observaciones: dto.observaciones,
      },
    })
  },

  async listarSalas(empresaId: number) {
    return prisma.agroCannabisSala.findMany({
      where: { empresaId, activa: true },
      include: { lote: { select: { id: true, nombre: true } }, _count: { select: { ciclos: true } } },
      orderBy: { nombre: "asc" },
    })
  },

  async crearSala(empresaId: number, dto: CreateSalaDto) {
    return prisma.agroCannabisSala.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        tipo: dto.tipo ?? "INDOOR",
        superficieM2: dto.superficieM2 ?? null,
        capacidadPlantas: dto.capacidadPlantas ?? null,
        loteId: dto.loteId ?? null,
      },
    })
  },

  async listarGeneticas(empresaId: number) {
    return prisma.agroCannabisGenetica.findMany({
      where: { empresaId, activa: true },
      orderBy: { nombre: "asc" },
    })
  },

  async crearGenetica(empresaId: number, dto: CreateGeneticaDto) {
    return prisma.agroCannabisGenetica.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        tipo: dto.tipo ?? "CBD",
        thcMaxPct: dto.thcMaxPct ?? null,
        cbdMaxPct: dto.cbdMaxPct ?? null,
        reprocannAutorizada: dto.reprocannAutorizada ?? true,
        notas: dto.notas ?? null,
      },
    })
  },

  async listarCiclos(empresaId: number, params?: { etapa?: string; activos?: boolean }) {
    const where: Record<string, unknown> = { empresaId }
    if (params?.etapa) where.etapa = params.etapa
    if (params?.activos) where.etapa = { not: "FINALIZADO" }

    return prisma.agroCannabisCiclo.findMany({
      where,
      include: {
        sala: true,
        genetica: true,
        _count: { select: { aplicaciones: true, cosechas: true } },
      },
      orderBy: { fechaInicio: "desc" },
    })
  },

  async crearCiclo(empresaId: number, dto: CreateCicloDto) {
    const ultimo = await prisma.agroCannabisCiclo.findFirst({
      where: { empresaId },
      orderBy: { createdAt: "desc" },
      select: { numero: true },
    })
    const numero = siguienteNumeroCiclo(ultimo?.numero)

    return prisma.agroCannabisCiclo.create({
      data: {
        empresaId,
        numero,
        salaId: dto.salaId,
        geneticaId: dto.geneticaId,
        etapa: dto.etapa ?? "GERMINACION",
        plantasIniciales: dto.plantasIniciales,
        plantasActuales: dto.plantasIniciales,
        observaciones: dto.observaciones ?? null,
      },
      include: { sala: true, genetica: true },
    })
  },

  async avanzarEtapa(empresaId: number, cicloId: number, etapa: EtapaCiclo, plantasActuales?: number) {
    const ciclo = await prisma.agroCannabisCiclo.findFirst({
      where: { id: cicloId, empresaId },
    })
    if (!ciclo) throw new Error("Ciclo no encontrado")

    return prisma.agroCannabisCiclo.update({
      where: { id: cicloId },
      data: {
        etapa,
        plantasActuales: plantasActuales ?? ciclo.plantasActuales,
        fechaFin: etapa === "FINALIZADO" ? new Date() : null,
      },
      include: { sala: true, genetica: true },
    })
  },

  async listarInsumos(empresaId: number, categoria?: string) {
    const where: Record<string, unknown> = { empresaId, activo: true }
    if (categoria) where.categoria = categoria

    return prisma.agroCannabisInsumo.findMany({
      where,
      include: { proveedor: { select: { id: true, nombre: true } } },
      orderBy: { nombre: "asc" },
    })
  },

  async crearInsumo(empresaId: number, dto: CreateInsumoDto) {
    return prisma.agroCannabisInsumo.create({
      data: {
        empresaId,
        codigo: dto.codigo,
        nombre: dto.nombre,
        categoria: dto.categoria,
        unidad: dto.unidad ?? "L",
        stockActual: dto.stockActual ?? 0,
        stockMinimo: dto.stockMinimo ?? 0,
        costoUnitario: dto.costoUnitario ?? 0,
        proveedorId: dto.proveedorId ?? null,
        fichaSeguridad: dto.fichaSeguridad ?? null,
        composicion: dto.composicion ?? null,
      },
    })
  },

  async listarAplicaciones(empresaId: number, params?: { cicloId?: number; limit?: number }) {
    const where: Record<string, unknown> = { empresaId }
    if (params?.cicloId) where.cicloId = params.cicloId

    return prisma.agroCannabisAplicacion.findMany({
      where,
      include: {
        insumo: true,
        ciclo: { include: { sala: true, genetica: true } },
      },
      orderBy: { fecha: "desc" },
      take: params?.limit ?? 100,
    })
  },

  async registrarAplicacion(empresaId: number, dto: CreateAplicacionDto) {
    return prisma.$transaction(async (tx) => {
      const insumo = await tx.agroCannabisInsumo.findFirst({
        where: { id: dto.insumoId, empresaId, activo: true },
      })
      if (!insumo) throw new Error("Insumo no encontrado")

      if (insumo.stockActual < dto.cantidad) {
        throw new Error(`Stock insuficiente de ${insumo.nombre}. Disponible: ${insumo.stockActual} ${insumo.unidad}`)
      }

      const costoTotal = dto.cantidad * insumo.costoUnitario

      const aplicacion = await tx.agroCannabisAplicacion.create({
        data: {
          empresaId,
          cicloId: dto.cicloId,
          insumoId: dto.insumoId,
          cantidad: dto.cantidad,
          unidad: dto.unidad ?? insumo.unidad,
          dosis: dto.dosis ?? null,
          costoTotal,
          operador: dto.operador ?? null,
          metodo: dto.metodo ?? null,
          observaciones: dto.observaciones ?? null,
          fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        },
        include: { insumo: true, ciclo: { include: { sala: true, genetica: true } } },
      })

      await tx.agroCannabisInsumo.update({
        where: { id: insumo.id },
        data: { stockActual: { decrement: dto.cantidad } },
      })

      await tx.agroCannabisCiclo.update({
        where: { id: dto.cicloId },
        data: { costoAcumulado: { increment: costoTotal } },
      })

      return aplicacion
    })
  },

  async listarAnalisisSuelo(empresaId: number, params?: { cicloId?: number; salaId?: number }) {
    const where: Record<string, unknown> = { empresaId }
    if (params?.cicloId) where.cicloId = params.cicloId
    if (params?.salaId) where.salaId = params.salaId

    return prisma.agroCannabisAnalisisSuelo.findMany({
      where,
      include: {
        ciclo: { include: { genetica: true } },
        sala: true,
      },
      orderBy: { fecha: "desc" },
    })
  },

  async registrarAnalisisSuelo(empresaId: number, dto: CreateAnalisisSueloDto) {
    return prisma.$transaction(async (tx) => {
      const analisis = await tx.agroCannabisAnalisisSuelo.create({
        data: {
          empresaId,
          cicloId: dto.cicloId ?? null,
          salaId: dto.salaId ?? null,
          tipoMuestra: dto.tipoMuestra ?? "SUSTRATO",
          ph: dto.ph ?? null,
          ec: dto.ec ?? null,
          nitrogeno: dto.nitrogeno ?? null,
          fosforo: dto.fosforo ?? null,
          potasio: dto.potasio ?? null,
          humedad: dto.humedad ?? null,
          costoAnalisis: dto.costoAnalisis ?? null,
          laboratorio: dto.laboratorio ?? null,
          notas: dto.notas ?? null,
          fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        },
        include: { ciclo: true, sala: true },
      })

      if (dto.costoAnalisis && dto.cicloId) {
        await tx.agroCannabisCiclo.update({
          where: { id: dto.cicloId },
          data: { costoAcumulado: { increment: dto.costoAnalisis } },
        })
      }

      return analisis
    })
  },

  async registrarCosecha(empresaId: number, dto: CreateCosechaDto) {
    const rendimientoGp =
      dto.pesoSecoKg && dto.plantasCosechadas > 0
        ? (dto.pesoSecoKg * 1000) / dto.plantasCosechadas
        : null

    return prisma.$transaction(async (tx) => {
      const cosecha = await tx.agroCannabisCosecha.create({
        data: {
          empresaId,
          cicloId: dto.cicloId,
          plantasCosechadas: dto.plantasCosechadas,
          pesoHumedoKg: dto.pesoHumedoKg ?? null,
          pesoSecoKg: dto.pesoSecoKg ?? null,
          rendimientoGp,
          destino: dto.destino ?? "ONG",
          loteTrazabilidad: dto.loteTrazabilidad ?? null,
          observaciones: dto.observaciones ?? null,
          fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        },
        include: { ciclo: { include: { sala: true, genetica: true } } },
      })

      await tx.agroCannabisCiclo.update({
        where: { id: dto.cicloId },
        data: {
          etapa: "FINALIZADO",
          plantasActuales: 0,
          fechaFin: new Date(),
        },
      })

      return cosecha
    })
  },

  async resumenDashboard(empresaId: number) {
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const [
      perfil,
      ciclosActivos,
      plantasActivas,
      insumosBajoStock,
      costoMes,
      aplicacionesRecientes,
      analisisRecientes,
      costosPorCategoria,
    ] = await Promise.all([
      this.obtenerPerfil(empresaId),
      prisma.agroCannabisCiclo.count({
        where: { empresaId, etapa: { not: "FINALIZADO" } },
      }),
      prisma.agroCannabisCiclo.aggregate({
        where: { empresaId, etapa: { not: "FINALIZADO" } },
        _sum: { plantasActuales: true },
      }),
      prisma.agroCannabisInsumo.findMany({
        where: { empresaId, activo: true },
        select: { stockActual: true, stockMinimo: true },
      }).then((items) => items.filter((i) => i.stockMinimo > 0 && i.stockActual <= i.stockMinimo).length),
      prisma.agroCannabisAplicacion.aggregate({
        where: { empresaId, fecha: { gte: inicioMes } },
        _sum: { costoTotal: true },
      }),
      this.listarAplicaciones(empresaId, { limit: 5 }),
      this.listarAnalisisSuelo(empresaId).then((a) => a.slice(0, 5)),
      prisma.agroCannabisAplicacion.groupBy({
        by: ["insumoId"],
        where: { empresaId, fecha: { gte: inicioMes } },
        _sum: { costoTotal: true },
      }),
    ])

    const insumoIds = costosPorCategoria.map((c) => c.insumoId)
    const insumos = insumoIds.length
      ? await prisma.agroCannabisInsumo.findMany({
          where: { id: { in: insumoIds } },
          select: { id: true, categoria: true, nombre: true },
        })
      : []

    const costoPorCategoriaMap: Record<string, number> = {}
    for (const row of costosPorCategoria) {
      const insumo = insumos.find((i) => i.id === row.insumoId)
      const cat = insumo?.categoria ?? "OTRO"
      costoPorCategoriaMap[cat] = (costoPorCategoriaMap[cat] ?? 0) + (row._sum.costoTotal ?? 0)
    }

    const plantasTotales = plantasActivas._sum.plantasActuales ?? 0
    const cupoPlantas = perfil?.cupoPlantas ?? null
    const cupoPct = cupoPlantas && cupoPlantas > 0 ? Math.round((plantasTotales / cupoPlantas) * 100) : null

    return {
      perfil,
      ciclosActivos,
      plantasActivas: plantasTotales,
      cupoPlantas,
      cupoPct,
      insumosBajoStock,
      costoMes: costoMes._sum.costoTotal ?? 0,
      costosPorCategoria: costoPorCategoriaMap,
      aplicacionesRecientes,
      analisisRecientes,
    }
  },
}