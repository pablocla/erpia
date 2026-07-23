import { prisma } from "@/lib/prisma"
import { WhatsappService } from "@/lib/whatsapp/whatsapp-service"

export async function runWhatsAppOutbound() {
  if (!WhatsappService.isConfigured()) {
    console.warn("[Cron WhatsApp] Twilio no configurado — modo dev (log only)")
  }

  const whatsappService = new WhatsappService()
  // Incluye cobranza Leo (prioridad variable) y recibos fiado (prioridad 5–6)
  const mensajes = await prisma.mensajePendienteWhatsApp.findMany({
    where: {
      estado: "aprobado",
      OR: [
        { prioridad: { gte: 5 } },
        {
          tipo: {
            in: [
              "cobranza",
              "fiado",
              "fiado_recibo",
              "fiado_ack",
              "fiado_consulta",
              "leo",
            ],
          },
        },
      ],
    },
    orderBy: [{ prioridad: "desc" }, { createdAt: "asc" }],
    take: 40,
  })

  const resultados: Array<{ id: number; enviado: boolean; error?: string }> = []

  for (const msg of mensajes) {
    try {
      await whatsappService.sendMessage(msg.telefono, msg.mensaje)
      await prisma.mensajePendienteWhatsApp.update({
        where: { id: msg.id },
        data: { estado: "enviado", enviadoAt: new Date() },
      })
      if (msg.tipo === "cobranza") {
        const { emitToN8n } = await import("@/lib/automation/n8n-bridge")
        const { buildIdempotencyKey } = await import("@/lib/automation/sign-payload")
        void emitToN8n(
          msg.empresaId,
          "CUENTA_VENCIDA",
          {
            mensajeId: msg.id,
            telefono: msg.telefono,
            destinatario: msg.destinatario,
            canal: "whatsapp",
          },
          buildIdempotencyKey(msg.empresaId, "CUENTA_VENCIDA", `wa-${msg.id}`)
        )
      }
      resultados.push({ id: msg.id, enviado: true })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      await prisma.mensajePendienteWhatsApp.update({
        where: { id: msg.id },
        data: { estado: "error", error: errorMessage },
      })
      resultados.push({ id: msg.id, enviado: false, error: errorMessage })
    }
  }

  return {
    procesados: resultados.length,
    enviados: resultados.filter((r) => r.enviado).length,
    errores: resultados.filter((r) => !r.enviado).length,
  }
}