import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { WhatsappService } from "@/lib/whatsapp/whatsapp-service"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const whatsappService = new WhatsappService()

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
        await whatsappService.sendMessage(msg.telefono, msg.mensaje)
        await prisma.mensajePendienteWhatsApp.update({
          where: { id: msg.id },
          data: { estado: "enviado", enviadoAt: new Date() },
        })
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
