/**
 * Servicio de Viralidad y Referral Automático para Comercios
 * Agrega enlaces virales y recompensas en tickets, links de MercadoPago y recordatorios de fiado por WhatsApp.
 */

import { prisma } from "@/lib/prisma"

export interface ReferralData {
  codigoReferido: string
  linkReferido: string
  recompensaTexto: string
  invitacionesExitosas: number
  mesesGratisGanados: number
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://claver.app"

/**
 * Obtiene o genera el código de referido viral para una empresa
 */
export async function obtenerReferralEmpresa(empresaId: number): Promise<ReferralData> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nombre: true, cuit: true },
  })

  const slugLimpio = (empresa?.nombre || "comercio")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 15)

  const codigoReferido = `${slugLimpio}${empresaId}`.toUpperCase()
  const linkReferido = `${APP_URL}/registro?ref=${codigoReferido}`

  // Contar cuántos se registraron con este código
  let invitacionesExitosas = 0
  try {
    const partner = await prisma.partnerProfile.findFirst({
      where: { referralCode: { equals: codigoReferido, mode: "insensitive" } },
      select: { id: true },
    })
    if (partner) {
      invitacionesExitosas = await prisma.empresa.count({
        where: { referredByPartnerId: partner.id },
      })
    }
  } catch {
    // Si no existe el registro de partner aún
  }

  return {
    codigoReferido,
    linkReferido,
    recompensaTexto: "Por cada comercio amigo que se sume, tenés 1 mes de Facturación AFIP gratis.",
    invitacionesExitosas,
    mesesGratisGanados: invitacionesExitosas,
  }
}

/**
 * Genera el pie de página viral para tickets y mensajes de cobro por WhatsApp
 */
export function generarFooterViral(referral: ReferralData): string {
  return `\n\n--------------------------------\n🚀 ¿Tenés un comercio? Usá Claver ERP gratis:\n👉 ${referral.linkReferido}`
}

/**
 * Genera el mensaje completo de cobro de fiado por WhatsApp con link de Mercado Pago y footer viral
 */
export function armarMensajeCobroFiadoViral(params: {
  nombreCliente: string
  montoDeuda: number
  linkMercadoPago?: string
  referral: ReferralData
}): string {
  const { nombreCliente, montoDeuda, linkMercadoPago, referral } = params
  let mensaje = `Hola ${nombreCliente}! Te paso el resumen de tu cuenta: $${montoDeuda.toLocaleString("es-AR")}.`

  if (linkMercadoPago) {
    mensaje += `\n\nPodés abonarlo con tarjeta o dinero en cuenta acá:\n💳 ${linkMercadoPago}`
  } else {
    mensaje += `\n\nPodés pasar a cancelar cuando quieras. Muchas gracias!`
  }

  mensaje += generarFooterViral(referral)
  return mensaje
}
