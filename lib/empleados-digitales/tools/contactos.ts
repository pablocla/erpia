import { prisma } from "@/lib/prisma"

/** Contactos WA de cobranza últimos 7 días (anti-spam) */
export async function countContactos7d(empresaId: number, clienteId: number) {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const tareas = await prisma.empleadoDigitalTarea.count({
    where: {
      empresaId,
      clienteId,
      tipo: { in: ["wa_borrador", "wa_enviado"] },
      estado: { notIn: ["rechazada", "cancelada"] },
      createdAt: { gte: since },
    },
  })
  return tareas
}

export async function yaContactadoHoy(empresaId: number, clienteId: number) {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const n = await prisma.empleadoDigitalTarea.count({
    where: {
      empresaId,
      clienteId,
      createdAt: { gte: start },
      estado: { notIn: ["rechazada", "cancelada"] },
    },
  })
  return n > 0
}
