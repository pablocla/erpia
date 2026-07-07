import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"

export type PropiedadEstado = "disponible" | "reservada" | "alquilada" | "vendida"
export type ContratoEstado = "activo" | "finalizado" | "rescindido"

export async function listarPropiedades(empresaId: number, estado?: string) {
  return prisma.propiedad.findMany({
    where: whereEmpresa(empresaId, estado ? { estado } : {}),
    include: {
      propietario: { select: { id: true, nombre: true, telefono: true } },
      contratos: {
        where: { estado: "activo" },
        take: 1,
        include: {
          inquilino: { select: { id: true, nombre: true, telefono: true } },
        },
      },
      _count: { select: { contratos: true } },
    },
    orderBy: [{ estado: "asc" }, { titulo: "asc" }],
  })
}

export async function crearPropiedad(
  empresaId: number,
  data: {
    titulo: string
    direccion: string
    tipo?: string
    ambientes?: number
    m2?: number
    precioAlquiler?: number
    fotoUrl?: string
    descripcion?: string
    propietarioId?: number
  },
) {
  return prisma.propiedad.create({
    data: {
      empresaId,
      titulo: data.titulo,
      direccion: data.direccion,
      tipo: data.tipo ?? "depto",
      ambientes: data.ambientes,
      m2: data.m2,
      precioAlquiler: data.precioAlquiler,
      fotoUrl: data.fotoUrl,
      descripcion: data.descripcion,
      propietarioId: data.propietarioId,
    },
    include: {
      propietario: { select: { id: true, nombre: true } },
    },
  })
}

export async function actualizarEstadoPropiedad(
  empresaId: number,
  propiedadId: number,
  estado: PropiedadEstado,
) {
  const row = await prisma.propiedad.findFirst({
    where: whereEmpresa(empresaId, { id: propiedadId }),
  })
  if (!row) throw new Error("Propiedad no encontrada")
  return prisma.propiedad.update({
    where: { id: propiedadId },
    data: { estado },
  })
}

export async function listarContratos(empresaId: number, estado?: string) {
  return prisma.contratoAlquiler.findMany({
    where: whereEmpresa(empresaId, estado ? { estado } : {}),
    include: {
      propiedad: { select: { id: true, titulo: true, direccion: true } },
      inquilino: { select: { id: true, nombre: true, telefono: true, email: true } },
      propietario: { select: { id: true, nombre: true, telefono: true } },
    },
    orderBy: [{ estado: "asc" }, { fechaFin: "asc" }],
  })
}

export async function crearContratoAlquiler(
  empresaId: number,
  data: {
    propiedadId: number
    inquilinoId: number
    propietarioId?: number
    montoMensual: number
    diaVencimiento?: number
    fechaInicio: string
    fechaFin: string
    deposito?: number
    garantiaTipo?: string
    observaciones?: string
  },
) {
  const propiedad = await prisma.propiedad.findFirst({
    where: whereEmpresa(empresaId, { id: data.propiedadId }),
  })
  if (!propiedad) throw new Error("Propiedad no encontrada")
  if (propiedad.estado === "alquilada") {
    throw new Error("La propiedad ya tiene un contrato activo")
  }

  const activo = await prisma.contratoAlquiler.findFirst({
    where: {
      propiedadId: data.propiedadId,
      estado: "activo",
    },
  })
  if (activo) throw new Error("Ya existe un contrato activo para esta propiedad")

  return prisma.$transaction(async (tx) => {
    const contrato = await tx.contratoAlquiler.create({
      data: {
        empresaId,
        propiedadId: data.propiedadId,
        inquilinoId: data.inquilinoId,
        propietarioId: data.propietarioId ?? propiedad.propietarioId,
        montoMensual: data.montoMensual,
        diaVencimiento: data.diaVencimiento ?? 10,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        deposito: data.deposito,
        garantiaTipo: data.garantiaTipo,
        observaciones: data.observaciones,
        estado: "activo",
      },
      include: {
        propiedad: { select: { titulo: true } },
        inquilino: { select: { nombre: true } },
      },
    })

    await tx.propiedad.update({
      where: { id: data.propiedadId },
      data: { estado: "alquilada" },
    })

    return contrato
  })
}

export async function finalizarContrato(empresaId: number, contratoId: number) {
  const contrato = await prisma.contratoAlquiler.findFirst({
    where: whereEmpresa(empresaId, { id: contratoId }),
  })
  if (!contrato) throw new Error("Contrato no encontrado")

  return prisma.$transaction(async (tx) => {
    const updated = await tx.contratoAlquiler.update({
      where: { id: contratoId },
      data: { estado: "finalizado" },
    })
    await tx.propiedad.update({
      where: { id: contrato.propiedadId },
      data: { estado: "disponible" },
    })
    return updated
  })
}

export async function resumenInmobiliaria(empresaId: number) {
  const [propiedades, contratosActivos, vencen30] = await Promise.all([
    prisma.propiedad.count({ where: { empresaId } }),
    prisma.contratoAlquiler.count({ where: { empresaId, estado: "activo" } }),
    prisma.contratoAlquiler.count({
      where: {
        empresaId,
        estado: "activo",
        fechaFin: {
          lte: new Date(Date.now() + 30 * 86_400_000),
          gte: new Date(),
        },
      },
    }),
  ])
  return { propiedades, contratosActivos, vencen30 }
}