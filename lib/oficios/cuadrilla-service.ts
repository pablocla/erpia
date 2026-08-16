import { prisma } from "@/lib/prisma"

export interface CreateOperarioDTO {
  nombre: string
  telefono: string
  rol: string
  valorJornal?: number
}

export async function getOperarios(empresaId: number) {
  return prisma.oficioOperario.findMany({
    where: { empresaId, activo: true },
    include: {
      asignaciones: {
        where: {
          fecha: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        include: {
          trabajo: {
            select: { id: true, titulo: true, direccion: true, estado: true },
          },
        },
      },
    },
    orderBy: { nombre: "asc" },
  })
}

export async function createOperario(empresaId: number, dto: CreateOperarioDTO) {
  return prisma.oficioOperario.create({
    data: {
      empresaId,
      nombre: dto.nombre,
      telefono: dto.telefono,
      rol: dto.rol,
      valorJornal: dto.valorJornal,
    },
  })
}

export async function asignarOperario(
  empresaId: number,
  trabajoId: string,
  operarioId: string,
  notas?: string,
) {
  // Verificar tenant
  const trabajo = await prisma.oficioTrabajo.findFirst({
    where: { id: trabajoId, empresaId },
  })
  if (!trabajo) throw new Error("Trabajo no pertenece a la empresa")

  return prisma.oficioAsignacion.create({
    data: {
      trabajoId,
      operarioId,
      notas,
    },
    include: {
      operario: true,
      trabajo: true,
    },
  })
}

export async function liquidarSemanaOperario(
  empresaId: number,
  operarioId: string,
  fechaDesde: Date,
  fechaHasta: Date,
) {
  const operario = await prisma.oficioOperario.findFirst({
    where: { id: operarioId, empresaId },
  })
  if (!operario) throw new Error("Operario no encontrado")

  // Obtener asignaciones dentro del rango
  const asignaciones = await prisma.oficioAsignacion.findMany({
    where: {
      operarioId,
      fecha: {
        gte: fechaDesde,
        lte: fechaHasta,
      },
    },
    include: {
      trabajo: { select: { titulo: true, direccion: true } },
    },
  })

  const diasTrabajados = asignaciones.length
  const valorJornal = Number(operario.valorJornal ?? 0)
  const totalBruto = diasTrabajados * valorJornal

  return {
    operario: {
      id: operario.id,
      nombre: operario.nombre,
      telefono: operario.telefono,
      rol: operario.rol,
      valorJornal,
    },
    periodo: {
      desde: fechaDesde.toISOString(),
      hasta: fechaHasta.toISOString(),
    },
    diasTrabajados,
    asignaciones: asignaciones.map((a) => ({
      id: a.id,
      fecha: a.fecha,
      trabajo: a.trabajo.titulo,
      direccion: a.trabajo.direccion,
    })),
    totalBruto,
    deduccionesVales: 0,
    netoAPagar: totalBruto,
  }
}
