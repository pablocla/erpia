import { prisma } from "@/lib/prisma"
import { normalizarTelefono } from "@/lib/alertas/whatsapp-regla-dispatcher"
import { canUseSku } from "@/lib/platform/entitlements"
import { recordUsageEvent } from "@/lib/platform/commercial-service"
import { WhatsappService } from "@/lib/whatsapp/whatsapp-service"

export interface FiadoWhatsAppInput {
  empresaId: number
  clienteNombre: string
  telefono: string | null | undefined
  totalVenta: number
  deudaTotal: number
  linkPago?: string | null
  almacenNombre: string
  /** Si true, intenta envío inmediato vía Cloud API / Twilio además de encolar */
  enviarAhora?: boolean
}

const fmt = (n: number) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

/**
 * Arma el cuerpo del recordatorio de fiado con CTA de pago (Mercado Pago).
 * Compatible con plantillas de texto y botones interactivos Cloud API.
 */
export function buildMensajeFiado(input: {
  clienteNombre: string
  almacenNombre: string
  totalVenta: number
  deudaTotal: number
  linkPago?: string | null
}): string {
  let texto = `Hola ${input.clienteNombre}, ${input.almacenNombre} registró una compra a fiado por ${fmt(input.totalVenta)}. Deuda total: ${fmt(input.deudaTotal)}.`
  if (input.linkPago) {
    texto += `\n\n💳 Pagá acá (Mercado Pago):\n${input.linkPago}`
    texto += `\n\nAl pagar se acredita automáticamente en tu cuenta corriente.`
  } else {
    texto += `\n\nConsultá en el local para saldar tu fiado.`
  }
  return texto
}

/**
 * Payload de mensaje interactivo (WhatsApp Cloud API / botones de respuesta).
 * El dispatcher puede usarlo si el canal soporta interactive messages.
 */
export function buildFiadoInteractivePayload(input: {
  clienteNombre: string
  almacenNombre: string
  totalVenta: number
  deudaTotal: number
  linkPago?: string | null
}) {
  const bodyText = buildMensajeFiado(input)
  const buttons: Array<{ type: "url" | "reply"; title: string; url?: string; id?: string }> = []

  if (input.linkPago) {
    buttons.push({
      type: "url",
      title: "Pagar ahora",
      url: input.linkPago,
    })
  }
  buttons.push({
    type: "reply",
    title: "Ya pagué",
    id: "fiado_ya_pague",
  })
  buttons.push({
    type: "reply",
    title: "Ver deuda",
    id: "fiado_ver_deuda",
  })

  return {
    type: "interactive" as const,
    body: bodyText,
    buttons: buttons.slice(0, 3),
    ctaUrl: input.linkPago ?? null,
  }
}

/**
 * Encola (y opcionalmente envía) un recordatorio de fiado por WhatsApp
 * con botón / link de cobro Mercado Pago.
 */
export async function encolarWhatsAppFiado(input: FiadoWhatsAppInput): Promise<boolean> {
  const tel = normalizarTelefono(input.telefono)
  if (!tel) return false

  const [access, empresa] = await Promise.all([
    canUseSku(input.empresaId, "channel.whatsapp"),
    prisma.empresa.findUnique({
      where: { id: input.empresaId },
      select: { fiadoNotificarWhatsApp: true },
    }),
  ])

  if (!access.ok || empresa?.fiadoNotificarWhatsApp === false) return false

  if (access.source === "subscription" || access.source === "feature") {
    await recordUsageEvent(input.empresaId, "channel.whatsapp", "fiado_wa")
  }

  const texto = buildMensajeFiado({
    clienteNombre: input.clienteNombre,
    almacenNombre: input.almacenNombre,
    totalVenta: input.totalVenta,
    deudaTotal: input.deudaTotal,
    linkPago: input.linkPago,
  })

  const interactive = buildFiadoInteractivePayload({
    clienteNombre: input.clienteNombre,
    almacenNombre: input.almacenNombre,
    totalVenta: input.totalVenta,
    deudaTotal: input.deudaTotal,
    linkPago: input.linkPago,
  })

  await prisma.mensajePendienteWhatsApp.create({
    data: {
      empresaId: input.empresaId,
      destinatario: input.clienteNombre,
      telefono: tel,
      mensaje: texto,
      tipo: "fiado",
      prioridad: 7,
      estado: "aprobado",
      // metadata opcional si el schema lo soporta vía campos existentes —
      // el texto ya incluye el CTA de pago para canales solo-texto.
    },
  })

  if (input.enviarAhora) {
    try {
      if (input.linkPago && WhatsappService.isCloudApiConfigured()) {
        await WhatsappService.sendCloudApiCtaUrl({
          to: tel,
          body: texto,
          displayText: "Pagar ahora",
          url: input.linkPago,
        })
      } else if (WhatsappService.isConfigured()) {
        const wa = new WhatsappService()
        if (input.linkPago) {
          await wa.sendInteractiveCtaUrl({
            to: tel,
            body: texto,
            displayText: "Pagar con MP",
            url: input.linkPago,
          })
        } else {
          await wa.sendMessage(tel, texto)
        }
      }
    } catch (err) {
      console.warn("[fiado-whatsapp] Envío inmediato falló; queda en cola:", err)
    }
  }

  // interactive se expone para callers avanzados / tests
  void interactive

  return true
}

/**
 * Tras webhook de pago MP confirmado: avisa al cliente con recibo digital.
 */
export async function encolarReciboPagoFiado(input: {
  empresaId: number
  clienteNombre: string
  telefono: string | null | undefined
  monto: number
  saldoRestante?: number
  almacenNombre?: string
}): Promise<boolean> {
  const tel = normalizarTelefono(input.telefono)
  if (!tel) return false

  const access = await canUseSku(input.empresaId, "channel.whatsapp")
  if (!access.ok) return false

  const comercio = input.almacenNombre ?? "el comercio"
  let mensaje = `✅ ${input.clienteNombre}, recibimos tu pago de ${fmt(input.monto)} en ${comercio}.`
  if (input.saldoRestante != null) {
    mensaje +=
      input.saldoRestante > 0
        ? `\nSaldo de fiado restante: ${fmt(input.saldoRestante)}.`
        : `\n¡Tu cuenta de fiado quedó en cero! Gracias.`
  }
  mensaje += `\n\nComprobante digital generado por Claver.`

  await prisma.mensajePendienteWhatsApp.create({
    data: {
      empresaId: input.empresaId,
      destinatario: input.clienteNombre,
      telefono: tel,
      mensaje,
      tipo: "fiado_recibo",
      prioridad: 5,
      estado: "aprobado",
    },
  })

  return true
}
