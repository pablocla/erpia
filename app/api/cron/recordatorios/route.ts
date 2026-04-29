import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    manana.setHours(0, 0, 0, 0)

    const turnos = await prisma.turno.findMany({
      where: {
        fecha: manana,
        estado: { in: ["pendiente", "confirmado"] },
        cliente: { telefono: { not: null } },
      },
      include: {
        cliente: true,
        profesional: true,
      },
    })

    const mensajes = await Promise.all(
      turnos.map(async (turno) => {
        const telefono = turno.cliente?.telefono?.replace(/[^0-9]/g, "")
        if (!telefono) return null

        const mensaje = `Hola ${turno.cliente?.nombre}, te recordamos tu turno el ${turno.fecha.toISOString().split("T")[0]} a las ${turno.horaInicio} con ${turno.profesional?.nombre}. Respondé CONFIRMAR o CANCELAR.`

        return prisma.mensajePendienteWhatsApp.create({
          data: {
            destinatario: turno.cliente.nombre,
            telefono,
            mensaje,
            tipo: "recordatorio_turno",
            prioridad: 8,
            estado: "pendiente",
            empresaId: turno.cliente.empresaId,
          },
        })
      }),
    )

    return NextResponse.json({ success: true, queued: mensajes.filter(Boolean).length })
  } catch (error) {
    console.error("Error al generar recordatorios:", error)
    return NextResponse.json({ error: "Error al generar recordatorios" }, { status: 500 })
  }
}
