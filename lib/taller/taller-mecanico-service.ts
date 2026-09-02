/**
 * Servicio de Gestión para Talleres Mecánicos y Reparaciones Automotrices
 * Dominios: Órdenes de Trabajo (OT) por Patente, Diagnóstico, Repuestos de Stock, Mano de Obra y WhatsApp "Auto Listo".
 */

import { prisma } from "@/lib/prisma"
import { OTService } from "@/lib/ot/ot-service"

export interface VehiculoTallerInput {
  clienteId: number
  patente: string
  marca: string
  modelo: string
  anio?: number
  km?: number
  nivelCombustible?: "reserva" | "un_cuarto" | "medio" | "tres_cuartos" | "lleno"
  detallesCarroceria?: string
  fallaReportada: string
  diagnosticoTecnico?: string
  tecnicoAsignado?: string
  fechaPrometida?: string
  items: {
    productoId?: number
    descripcion: string
    cantidad: number
    precioUnitario: number
    tipo: "REPUESTO" | "MANO_OBRA"
  }[]
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://claver.app"

export class TallerMecanicoService {
  private otService = new OTService()

  /**
   * Crea una nueva Orden de Trabajo para un vehículo
   */
  async crearOrdenVehiculo(empresaId: number, input: VehiculoTallerInput) {
    const patenteLimpia = input.patente.toUpperCase().replace(/[^A-Z0-9]/g, "")
    const titulo = `${input.marca} ${input.modelo} — [${patenteLimpia}]`

    return await this.otService.crearOrden(empresaId, {
      clienteId: input.clienteId,
      titulo,
      descripcion: input.fallaReportada,
      estado: "RECEPCION",
      fechaPrometida: input.fechaPrometida ? new Date(input.fechaPrometida) : undefined,
      tecnicoAsignado: input.tecnicoAsignado,
      metadata: {
        vertical: "taller_mecanico",
        patente: patenteLimpia,
        marca: input.marca,
        modelo: input.modelo,
        anio: input.anio,
        km: input.km,
        nivelCombustible: input.nivelCombustible,
        detallesCarroceria: input.detallesCarroceria,
        diagnosticoTecnico: input.diagnosticoTecnico,
      },
      items: input.items,
    })
  }

  /**
   * Lista todas las reparaciones activas e históricas del taller
   */
  async listarReparaciones(empresaId: number, filtroPatente?: string) {
    const ots = await prisma.ordenServicio.findMany({
      where: {
        empresaId,
        metadata: {
          path: ["vertical"],
          equals: "taller_mecanico",
        },
      },
      include: {
        cliente: {
          select: { id: true, nombre: true, telefono: true, email: true },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    })

    if (!filtroPatente) return ots

    const q = filtroPatente.toUpperCase().replace(/[^A-Z0-9]/g, "")
    return ots.filter((o) => {
      const meta = o.metadata as { patente?: string } | null
      return meta?.patente?.includes(q)
    })
  }

  /**
   * Cambia el estado de una reparación
   */
  async actualizarEstado(empresaId: number, ordenId: number, nuevoEstado: string) {
    return await prisma.ordenServicio.update({
      where: { id: ordenId, empresaId },
      data: { estado: nuevoEstado },
      include: { cliente: true, items: true },
    })
  }

  /**
   * Genera el mensaje y link de WhatsApp para avisar que el auto está listo
   */
  async generarMensajeAutoListo(empresaId: number, ordenId: number) {
    const orden = await prisma.ordenServicio.findUnique({
      where: { id: ordenId, empresaId },
      include: { cliente: true, items: true },
    })

    if (!orden) throw new Error("Orden no encontrada")

    const meta = orden.metadata as {
      patente?: string
      marca?: string
      modelo?: string
    } | null

    const vehiculo = `${meta?.marca || ""} ${meta?.modelo || "tu auto"} [${meta?.patente || ""}]`.trim()
    const nombreCliente = orden.cliente?.nombre || "Cliente"
    const total = Number(orden.total) || 0

    const itemsTexto = orden.items
      .map((it) => `• ${it.descripcion} ($${Number(it.precioUnitario).toLocaleString("es-AR")})`)
      .join("\n")

    const textoWhatsApp = `Hola ${nombreCliente}! 👋
Tu vehículo *${vehiculo}* ya está *LISTO* para retirar en el taller. 🚗🔧

*Detalle del trabajo:*
${itemsTexto}

💰 *Total a abonar:* $${total.toLocaleString("es-AR")}
Aceptamos efectivo, débito, transferencia y Mercado Pago.

¡Te esperamos cuando gustes!`

    const telefonoLimpio = (orden.cliente?.telefono || "").replace(/[^0-9]/g, "")
    const linkWhatsApp = telefonoLimpio
      ? `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(textoWhatsApp)}`
      : `https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`

    return {
      textoWhatsApp,
      linkWhatsApp,
      telefono: orden.cliente?.telefono,
      cliente: orden.cliente?.nombre,
      vehiculo,
      total,
    }
  }
}
