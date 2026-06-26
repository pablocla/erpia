import { prisma } from "@/lib/prisma"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

/** Defaults al activar SKU pos.fiado_barrio desde marketplace */
export async function activarLibretaFiado(empresaId: number) {
  const waActivo = await prisma.suscripcionModulo.findFirst({
    where: {
      empresaId,
      sku: { in: ["com.whatsapp", "channel.whatsapp"] },
      activo: true,
    },
  })

  await prisma.empresa.update({
    where: { id: empresaId },
    data: {
      fiadoRequiereLimite: true,
      fiadoNotificarWhatsApp: !!waActivo,
    },
  })

  await ErrorLogger.log({
    severidad: "error",
    categoria: "FIADO_PROVISION",
    mensaje: "Libreta Fiado activada — defaults de configuración aplicados",
    metadata: { whatsappSugerido: !!waActivo },
  })

  return { ok: true, whatsappSugerido: !!waActivo }
}