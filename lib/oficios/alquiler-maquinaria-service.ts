/**
 * Servicio de Alquiler y Control de Maquinaria / Herramientas para Oficios & Obras
 */

import { prisma } from "@/lib/prisma"

export async function listarMaquinarias(empresaId: number, estado?: string) {
  return prisma.oficioMaquinaria.findMany({
    where: {
      empresaId,
      activo: true,
      ...(estado ? { estado } : {}),
    },
    orderBy: { nombre: "asc" },
  })
}

export async function crearMaquinaria(
  empresaId: number,
  data: {
    codigo: string
    nombre: string
    categoria?: string
    numeroSerie?: string
    tarifaDiaria: number
    tarifaSemanal?: number
    tarifaMensual?: number
    montoGarantia?: number
    fotosUrls?: string[]
  }
) {
  return prisma.oficioMaquinaria.create({
    data: {
      empresaId,
      codigo: data.codigo.trim().toUpperCase(),
      nombre: data.nombre.trim(),
      categoria: data.categoria || "Herramientas",
      numeroSerie: data.numeroSerie || null,
      tarifaDiaria: data.tarifaDiaria,
      tarifaSemanal: data.tarifaSemanal || null,
      tarifaMensual: data.tarifaMensual || null,
      montoGarantia: data.montoGarantia || 0,
      fotosUrls: data.fotosUrls || [],
    },
  })
}

export async function listarContratosAlquiler(empresaId: number, estado?: string) {
  return prisma.oficioAlquilerContrato.findMany({
    where: {
      empresaId,
      ...(estado ? { estado } : {}),
    },
    include: {
      cliente: {
        select: { id: true, nombre: true, telefono: true, direccion: true },
      },
      maquinaria: true,
    },
    orderBy: { fechaPactadaDevolucion: "asc" },
  })
}

export async function crearContratoAlquiler(
  empresaId: number,
  data: {
    clienteId: number
    maquinariaId: string
    trabajoId?: string
    fechaInicio?: Date
    fechaPactadaDevolucion: Date
    montoPactado: number
    depositoGarantia?: number
    fotosEntrega?: string[]
    observaciones?: string
  }
) {
  return prisma.$transaction(async (tx) => {
    // 1. Crear el contrato
    const contrato = await tx.oficioAlquilerContrato.create({
      data: {
        empresaId,
        clienteId: data.clienteId,
        maquinariaId: data.maquinariaId,
        trabajoId: data.trabajoId || null,
        fechaInicio: data.fechaInicio || new Date(),
        fechaPactadaDevolucion: data.fechaPactadaDevolucion,
        montoPactado: data.montoPactado,
        depositoGarantia: data.depositoGarantia || 0,
        fotosEntrega: data.fotosEntrega || [],
        observaciones: data.observaciones || null,
        estado: "ACTIVO",
      },
    })

    // 2. Marcar maquinaria como ALQUILADA
    await tx.oficioMaquinaria.update({
      where: { id: data.maquinariaId },
      data: { estado: "ALQUILADO" },
    })

    return contrato
  })
}

export async function devolverMaquinariaContrato(
  empresaId: number,
  contratoId: string,
  data: {
    fechaDevolucionReal?: Date
    cargosExtras?: number
    depositoDevuelto?: boolean
    fotosDevolucion?: string[]
    observacionesDevolucion?: string
    estadoFinal?: "DEVUELTO" | "DANADO"
  }
) {
  return prisma.$transaction(async (tx) => {
    const contrato = await tx.oficioAlquilerContrato.findFirst({
      where: { id: contratoId, empresaId },
    })
    if (!contrato) throw new Error("Contrato de alquiler no encontrado")

    const actualizado = await tx.oficioAlquilerContrato.update({
      where: { id: contratoId },
      data: {
        fechaDevolucionReal: data.fechaDevolucionReal || new Date(),
        cargosExtras: data.cargosExtras || 0,
        depositoDevuelto: data.depositoDevuelto ?? true,
        fotosDevolucion: data.fotosDevolucion || [],
        estado: data.estadoFinal || "DEVUELTO",
        observaciones: data.observacionesDevolucion
          ? `${contrato.observaciones || ""}\nDevolución: ${data.observacionesDevolucion}`.trim()
          : contrato.observaciones,
      },
    })

    // 2. Liberar la maquinaria a DISPONIBLE o EN_MANTENIMIENTO
    await tx.oficioMaquinaria.update({
      where: { id: contrato.maquinariaId },
      data: {
        estado: data.estadoFinal === "DANADO" ? "EN_MANTENIMIENTO" : "DISPONIBLE",
      },
    })

    return actualizado
  })
}
