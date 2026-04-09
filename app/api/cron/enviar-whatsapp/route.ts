import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/cron/enviar-whatsapp — Hourly WhatsApp sending job
 * Processes approved messages (estado = "aprobado") with prioridad >= 8.
 * Protected by CRON_SECRET header.
 *
 * NOTE: Actual WhatsApp sending via Twilio is a placeholder.
 * Replace sendWhatsApp() with your Twilio implementation.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    // Get approved messages with high priority
    const mensajes = await prisma.mensajePendienteWhatsApp.findMany({
      where: {
        estado: "aprobado",
        prioridad: { gte: 8 },
      },
      orderBy: [{ prioridad: "desc" }, { createdAt: "asc" }],
      take: 20,
    })

    const resultados: Array<{ id: number; enviado: boolean; error?: string }> = []

    for (const msg of mensajes) {
      try {
        // TODO: Replace with actual Twilio WhatsApp API integration
        // const sent = await sendWhatsApp(msg.telefono, msg.mensaje)
        const sent = await sendWhatsAppPlaceholder(msg.telefono, msg.mensaje)

        if (sent) {
          await prisma.mensajePendienteWhatsApp.update({
            where: { id: msg.id },
            data: { estado: "enviado", enviadoAt: new Date() },
          })
          resultados.push({ id: msg.id, enviado: true })
        } else {
          throw new Error("WhatsApp API no configurada")
        }
      } catch (err) {
        await prisma.mensajePendienteWhatsApp.update({
          where: { id: msg.id },
          data: { estado: "error", error: (err as Error).message },
        })
        resultados.push({ id: msg.id, enviado: false, error: (err as Error).message })
      }
    }

    return NextResponse.json({
      success: true,
      procesados: resultados.length,
      enviados: resultados.filter(r => r.enviado).length,
      errores: resultados.filter(r => !r.enviado).length,
      resultados,
    })
  } catch (error) {
    console.error("[Cron WhatsApp] Error:", error)
    return NextResponse.json({ error: "Error en cron WhatsApp" }, { status: 500 })
  }
}

/**
 * Placeholder for Twilio WhatsApp integration.
 * Replace with:
 *
 * import twilio from 'twilio'
 * const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
 *
 * async function sendWhatsApp(telefono: string, mensaje: string): Promise<boolean> {
 *   const msg = await client.messages.create({
 *     body: mensaje,
 *     from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
 *     to: `whatsapp:+54${telefono}`,
 *   })
 *   return msg.status !== 'failed'
 * }
 */
async function sendWhatsAppPlaceholder(telefono: string, mensaje: string): Promise<boolean> {
  if (!process.env.TWILIO_SID) {
    console.log(`[WhatsApp Placeholder] → ${telefono}: ${mensaje.slice(0, 80)}...`)
    return false
  }
  return false
}
