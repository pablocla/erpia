/**
 * Maestros de zona y ubicación (bins) — WMS light
 */

import { prisma } from "@/lib/prisma"

export async function listarZonas(empresaId: number, depositoId?: number) {
  return prisma.zonaAlmacen.findMany({
    where: {
      empresaId,
      ...(depositoId ? { depositoId } : {}),
      activo: true,
    },
    orderBy: [{ ordenPath: "asc" }, { codigo: "asc" }],
  })
}

export async function crearZona(
  empresaId: number,
  data: {
    depositoId: number
    codigo: string
    nombre: string
    tipo?: string
    ordenPath?: number
  },
) {
  const dep = await prisma.deposito.findFirst({
    where: { id: data.depositoId, empresaId },
  })
  if (!dep) throw new Error("DEPOSITO_NO_ENCONTRADO")

  return prisma.zonaAlmacen.create({
    data: {
      empresaId,
      depositoId: data.depositoId,
      codigo: data.codigo.trim().toUpperCase(),
      nombre: data.nombre.trim(),
      tipo: data.tipo ?? "picking",
      ordenPath: data.ordenPath ?? 0,
    },
  })
}

export async function listarUbicaciones(
  empresaId: number,
  filters: { depositoId?: number; zonaId?: number; tipo?: string; q?: string } = {},
) {
  return prisma.ubicacionAlmacen.findMany({
    where: {
      empresaId,
      activo: true,
      ...(filters.depositoId ? { depositoId: filters.depositoId } : {}),
      ...(filters.zonaId ? { zonaId: filters.zonaId } : {}),
      ...(filters.tipo ? { tipo: filters.tipo } : {}),
      ...(filters.q
        ? {
            OR: [
              { codigo: { contains: filters.q, mode: "insensitive" } },
              { pasillo: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      zona: { select: { id: true, codigo: true, nombre: true, tipo: true } },
      _count: { select: { stocks: true } },
    },
    orderBy: [{ ordenPath: "asc" }, { codigo: "asc" }],
  })
}

export async function crearUbicacion(
  empresaId: number,
  data: {
    depositoId: number
    codigo: string
    zonaId?: number | null
    pasillo?: string
    rack?: string
    nivel?: string
    celda?: string
    tipo?: string
    capacidad?: number | null
    ordenPath?: number
  },
) {
  const dep = await prisma.deposito.findFirst({
    where: { id: data.depositoId, empresaId },
  })
  if (!dep) throw new Error("DEPOSITO_NO_ENCONTRADO")

  if (data.zonaId) {
    const zona = await prisma.zonaAlmacen.findFirst({
      where: { id: data.zonaId, empresaId, depositoId: data.depositoId },
    })
    if (!zona) throw new Error("ZONA_NO_ENCONTRADA")
  }

  const codigo = data.codigo.trim().toUpperCase()
  return prisma.ubicacionAlmacen.create({
    data: {
      empresaId,
      depositoId: data.depositoId,
      codigo,
      zonaId: data.zonaId ?? null,
      pasillo: data.pasillo ?? null,
      rack: data.rack ?? null,
      nivel: data.nivel ?? null,
      celda: data.celda ?? null,
      tipo: data.tipo ?? "bin",
      capacidad: data.capacidad ?? null,
      ordenPath: data.ordenPath ?? 0,
    },
  })
}

/** Seed rápido: genera bins A-01-01 … en grilla para un depósito */
export async function seedUbicacionesGrid(
  empresaId: number,
  depositoId: number,
  opts: { pasillos?: number; racks?: number; niveles?: number } = {},
) {
  const pasillos = opts.pasillos ?? 2
  const racks = opts.racks ?? 3
  const niveles = opts.niveles ?? 2

  let zona = await prisma.zonaAlmacen.findFirst({
    where: { empresaId, depositoId, codigo: "PICK" },
  })
  if (!zona) {
    zona = await crearZona(empresaId, {
      depositoId,
      codigo: "PICK",
      nombre: "Zona picking",
      tipo: "picking",
      ordenPath: 1,
    })
  }

  const created: string[] = []
  let orden = 1
  for (let p = 1; p <= pasillos; p++) {
    const pasillo = String.fromCharCode(64 + p) // A, B, …
    for (let r = 1; r <= racks; r++) {
      for (let n = 1; n <= niveles; n++) {
        const codigo = `${pasillo}-${String(r).padStart(2, "0")}-${String(n).padStart(2, "0")}`
        const exists = await prisma.ubicacionAlmacen.findFirst({
          where: { depositoId, codigo },
        })
        if (exists) continue
        await prisma.ubicacionAlmacen.create({
          data: {
            empresaId,
            depositoId,
            zonaId: zona.id,
            codigo,
            pasillo,
            rack: String(r),
            nivel: String(n),
            tipo: "pick",
            ordenPath: orden++,
          },
        })
        created.push(codigo)
      }
    }
  }

  // Staging
  const stageCodigo = "STAGE-01"
  const stageExists = await prisma.ubicacionAlmacen.findFirst({
    where: { depositoId, codigo: stageCodigo },
  })
  if (!stageExists) {
    await prisma.ubicacionAlmacen.create({
      data: {
        empresaId,
        depositoId,
        codigo: stageCodigo,
        tipo: "stage",
        ordenPath: 9000,
      },
    })
    created.push(stageCodigo)
  }

  return { created: created.length, codigos: created }
}

export async function resolverUbicacionPorCodigo(
  empresaId: number,
  depositoId: number,
  codigo: string,
) {
  return prisma.ubicacionAlmacen.findFirst({
    where: {
      empresaId,
      depositoId,
      codigo: codigo.trim().toUpperCase(),
      activo: true,
    },
  })
}
