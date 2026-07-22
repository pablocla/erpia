import { prisma } from "@/lib/prisma"
import { normalizarTelefono } from "@/lib/alertas/whatsapp-regla-dispatcher"
import { canUseSku } from "@/lib/platform/entitlements"
import { recordUsageEvent } from "@/lib/platform/commercial-service"

export async function encolarWhatsAppFiado(input: {
  empresaId: number
  clienteNombre: string
  telefono: string | null | undefined
  totalVenta: number
  deudaTotal: number
  linkPago?: string | null
  almacenNombre: string
}): Promise<boolean> {
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

  // Track event to increase the usage counter
  if (access.source === "subscription" || access.source === "feature") {
    await recordUsageEvent(input.empresaId, "channel.whatsapp", "fiado_wa")
  }

  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })

  let texto = `Hola ${input.clienteNombre}, ${input.almacenNombre} registró una compra a fiado por ${fmt(input.totalVenta)}. Deuda total: ${fmt(input.deudaTotal)}.`
  if (input.linkPago) {
    texto += `\n\nPagá acá: ${input.linkPago}`
  }

  await prisma.mensajePendienteWhatsApp.create({
    data: {
      empresaId: input.empresaId,
      destinatario: input.clienteNombre,
      telefono: tel,
      mensaje: texto,
      tipo: "fiado",
      prioridad: 7,
      estado: "aprobado",
    },
  })

  return true
}