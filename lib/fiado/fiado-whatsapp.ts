import { prisma } from "@/lib/prisma"
import { normalizarTelefono } from "@/lib/alertas/whatsapp-regla-dispatcher"

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

  const [waActivo, empresa] = await Promise.all([
    prisma.suscripcionModulo.findFirst({
      where: {
        empresaId: input.empresaId,
        sku: { in: ["com.whatsapp", "channel.whatsapp"] },
        activo: true,
      },
    }),
    prisma.empresa.findUnique({
      where: { id: input.empresaId },
      select: { fiadoNotificarWhatsApp: true },
    }),
  ])

  if (!waActivo || empresa?.fiadoNotificarWhatsApp === false) return false

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