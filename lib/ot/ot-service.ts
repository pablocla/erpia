import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type CreateOTInput = {
  clienteId: number
  numero: string
  estado?: string
  titulo?: string
  descripcion?: string
  fechaPrometida?: Date
  tecnicoAsignado?: string
  metadata?: Prisma.InputJsonValue
  items: {
    productoId?: number
    descripcion: string
    cantidad: number
    precioUnitario: number
    tipo: "REPUESTO" | "MANO_OBRA"
  }[]
}

export class OTService {
  async crearOrden(empresaId: number, input: CreateOTInput) {
    const total = input.items.reduce(
      (acc, item) => acc + Number(item.cantidad) * Number(item.precioUnitario),
      0
    )

    return await prisma.$transaction(async (tx) => {
      // 1. Crear la Orden y sus Items
      const orden = await tx.ordenServicio.create({
        data: {
          empresaId,
          clienteId: input.clienteId,
          numero: input.numero,
          estado: "PENDIENTE",
          titulo: input.titulo,
          descripcion: input.descripcion,
          fechaPrometida: input.fechaPrometida,
          tecnicoAsignado: input.tecnicoAsignado,
          metadata: input.metadata ?? {},
          total: total,
          items: {
            create: input.items.map(item => ({
              productoId: item.productoId,
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              tipo: item.tipo
            }))
          }
        },
        include: {
          items: true
        }
      })

      // 2. Descontar stock para los REPUESTOS (si tienen productoId)
      for (const item of input.items) {
        if (item.tipo === "REPUESTO" && item.productoId) {
          const prod = await tx.producto.findUnique({ where: { id: item.productoId } })
          if (prod && prod.tipoProducto !== "servicio") {
            await tx.producto.update({
              where: { id: prod.id },
              data: { stock: { decrement: item.cantidad } }
            })
          }
        }
      }

      return orden
    })
  }

  async listarOrdenes(empresaId: number, filters?: { clienteId?: number; estado?: string }) {
    return prisma.ordenServicio.findMany({
      where: {
        empresaId,
        activo: true,
        ...(filters?.clienteId && { clienteId: filters.clienteId }),
        ...(filters?.estado && { estado: filters.estado }),
      },
      include: {
        cliente: { select: { nombre: true, telefono: true } },
        items: true,
      },
      orderBy: { fechaCreacion: "desc" },
    })
  }

  async cambiarEstado(empresaId: number, ordenId: number, nuevoEstado: string) {
    return prisma.ordenServicio.update({
      where: { id: ordenId, empresaId },
      data: { estado: nuevoEstado }
    })
  }
}
