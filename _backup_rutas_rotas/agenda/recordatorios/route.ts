import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage } from "@/lib/whatsapp/whatsapp-service"

export async function POST(req: NextRequest) {
  // CRON job endpoint para recordar turnos de mañana
  const manana = new Date()
  manana.setDate(manana.getDate() + 1)
  
  const start = new Date(manana.setHours(0,0,0,0))
  const end = new Date(manana.setHours(23,59,59,999))

  const turnosManana = await prisma.turno.findMany({
    where: {
      fechaHora: { gte: start, lte: end },
      estado: "confirmado"
    },
    include: { cliente: true, servicio: true }
  })

  let count = 0
  for (const turno of turnosManana) {
    if (turno.cliente?.telefono) {
      const msg = `Hola ${turno.cliente.nombre}, te recordamos tu turno de ${turno.servicio?.nombre || 'peluquería'} mañana a las ${turno.fechaHora.toLocaleTimeString('es-AR')}. ¡Te esperamos!`
      await sendWhatsAppMessage(turno.empresaId, turno.cliente.telefono, msg)
      count++
    }
  }

  return NextResponse.json({ ok: true, sent: count })
}
