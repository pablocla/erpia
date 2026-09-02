/**
 * Servicio de Gestión para Técnicos y Servicios de Campo / Domicilio
 * Rubros: Aire Acondicionado, Fumigación, Plomería, Electricistas, Instaladores.
 * Dominios: Visitas a domicilio, Checklist técnico, Firma del cliente y Certificado por WhatsApp.
 */

import { prisma } from "@/lib/prisma"
import { OTService } from "@/lib/ot/ot-service"

export interface VisitaCampoInput {
  clienteId: number
  direccion: string
  telefono?: string
  rubroServicio: "aire_acondicionado" | "fumigacion" | "plomeria" | "electricidad" | "service_general"
  motivoVisita: string
  tecnicoAsignado?: string
  fechaVisita?: string
  checklist: { tarea: string; realizada: boolean }[]
  repuestosUtilizados: { descripcion: string; cantidad: number; precioUnitario: number }[]
  manoDeObra: number
  observaciones?: string
  firmadoPorCliente?: string
}

export class ServiciosCampoService {
  private otService = new OTService()

  async registrarVisita(empresaId: number, input: VisitaCampoInput) {
    const items = [
      ...input.repuestosUtilizados.map((r) => ({
        descripcion: r.descripcion,
        cantidad: r.cantidad,
        precioUnitario: r.precioUnitario,
        tipo: "REPUESTO" as const,
      })),
      ...(input.manoDeObra > 0
        ? [{ descripcion: "Mano de obra técnica en domicilio", cantidad: 1, precioUnitario: input.manoDeObra, tipo: "MANO_OBRA" as const }]
        : []),
    ]

    const titulo = `Servicio a Domicilio — ${input.direccion}`

    return await this.otService.crearOrden(empresaId, {
      clienteId: input.clienteId,
      titulo,
      descripcion: input.motivoVisita,
      estado: "EN_CURSO",
      fechaPrometida: input.fechaVisita ? new Date(input.fechaVisita) : new Date(),
      tecnicoAsignado: input.tecnicoAsignado,
      metadata: {
        vertical: "servicios_campo",
        rubroServicio: input.rubroServicio,
        direccion: input.direccion,
        telefono: input.telefono,
        checklist: input.checklist,
        observaciones: input.observaciones,
        firmadoPorCliente: input.firmadoPorCliente,
      },
      items,
    })
  }

  async listarVisitas(empresaId: number) {
    return await prisma.ordenServicio.findMany({
      where: {
        empresaId,
        metadata: {
          path: ["vertical"],
          equals: "servicios_campo",
        },
      },
      include: { cliente: true, items: true },
      orderBy: { createdAt: "desc" },
    })
  }

  async generarCertificadoWhatsApp(empresaId: number, ordenId: number) {
    const orden = await prisma.ordenServicio.findUnique({
      where: { id: ordenId, empresaId },
      include: { cliente: true, items: true },
    })

    if (!orden) throw new Error("Orden de servicio no encontrada")

    const meta = orden.metadata as {
      rubroServicio?: string
      direccion?: string
      checklist?: { tarea: string; realizada: boolean }[]
    } | null

    const cliente = orden.cliente?.nombre || "Cliente"
    const total = Number(orden.total) || 0
    const direccion = meta?.direccion || "Domicilio"

    const tareasRealizadas = meta?.checklist
      ?.filter((c) => c.realizada)
      .map((c) => `✅ ${c.tarea}`)
      .join("\n") || "• Servicio técnico completado"

    const textoWhatsApp = `Hola ${cliente}! 🛠️
Adjuntamos el *Certificado de Servicio Técnico / Visita* realizado en *${direccion}*.

*Tareas Realizadas:*
${tareasRealizadas}

💰 *Monto Total del Servicio:* $${total.toLocaleString("es-AR")}

El trabajo cuenta con garantía de servicio. ¡Muchas gracias por confiar en nosotros!`

    const telefonoLimpio = (orden.cliente?.telefono || "").replace(/[^0-9]/g, "")
    const linkWhatsApp = telefonoLimpio
      ? `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(textoWhatsApp)}`
      : `https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`

    return {
      textoWhatsApp,
      linkWhatsApp,
      cliente,
      total,
      direccion,
    }
  }
}
