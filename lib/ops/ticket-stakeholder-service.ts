import { prisma } from "@/lib/prisma"
import { notifyAnalistasComentarioStakeholder } from "@/lib/ops/ops-notificaciones"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

function db() {
  return prisma as any
}

export async function agregarComentarioStakeholder(
  empresaId: number,
  ticketId: number,
  texto: string,
  autorEmail: string,
) {
  const ticket = await db().ticket.findFirst({
    where: { id: ticketId, empresaId },
    select: { id: true, numero: true, titulo: true },
  })
  if (!ticket) throw new Error("Ticket no encontrado")

  const textoLimpio = texto.trim()
  const comentario = await db().comentarioTicket.create({
    data: {
      ticketId,
      texto: textoLimpio,
      autor: `[Cliente] ${autorEmail}`,
    },
  })

  await db().ticket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  })

  await persistSistemaLog({
    empresaId,
    categoria: "soporte",
    contexto: "ticket:comentario-cliente",
    severidad: "info",
    mensaje: `Comentario stakeholder en ${ticket.numero}`,
    metadata: { ticketId, comentarioId: comentario.id },
  })

  void notifyAnalistasComentarioStakeholder({
    empresaId,
    ticketId,
    numero: ticket.numero,
    titulo: ticket.titulo,
    stakeholderEmail: autorEmail,
    texto: textoLimpio,
  }).catch(() => {})

  return comentario
}