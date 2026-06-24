import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { estaVencidoSla } from "@/lib/soporte/tickets-service"
import {
  notifyAnalistasJobFallido,
  notifyAnalistasEntornoCaido,
  notifyAnalistasTicketSlaBreach,
  notifyAnalistasImplementacionAtrasada,
} from "@/lib/ops/ops-notificaciones"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const db = prisma as any
  const haceUnaHora = new Date(Date.now() - 60 * 60 * 1000)
  let alertas = 0

  const entornosError = await db.tenantEntorno.findMany({
    where: { estado: "error", updatedAt: { lte: haceUnaHora } },
    select: { id: true, empresaId: true, codigo: true, updatedAt: true },
  })

  for (const ent of entornosError) {
    await persistSistemaLog({
      empresaId: ent.empresaId,
      entornoId: ent.id,
      severidad: "fatal",
      categoria: "ops",
      contexto: "cron:ops-alertas",
      mensaje: `Entorno ${ent.codigo} en error > 1h`,
    })
    void notifyAnalistasEntornoCaido({
      empresaId: ent.empresaId,
      codigo: ent.codigo,
      desde: ent.updatedAt,
    }).catch((e) => console.error("Error al notificar entorno caído:", e))
    alertas += 1
  }

  const ticketsAbiertos = await db.ticket.findMany({
    where: { estado: { in: ["abierto", "en_progreso"] } },
    select: { id: true, empresaId: true, numero: true, prioridad: true, estado: true, createdAt: true },
  })

  for (const t of ticketsAbiertos) {
    if (!estaVencidoSla(t.estado, t.prioridad, t.createdAt)) continue
    await persistSistemaLog({
      empresaId: t.empresaId,
      severidad: "warn",
      categoria: "ops",
      contexto: "cron:sla-ticket",
      mensaje: `Ticket ${t.numero} con SLA vencido`,
      metadata: { ticketId: t.id },
    })
    void notifyAnalistasTicketSlaBreach({
      empresaId: t.empresaId,
      ticketId: t.id,
      numero: t.numero,
      prioridad: t.prioridad,
    }).catch((e) => console.error("Error al notificar SLA vencido:", e))
    alertas += 1
  }

  const jobsErrorRecientes = await db.opsJob.findMany({
    where: {
      errorMsg: { not: null },
      estado: "error",
      finishedAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
    take: 20,
  })

  for (const job of jobsErrorRecientes) {
    void notifyAnalistasJobFallido({
      empresaId: job.empresaId,
      jobId: job.id,
      tipo: job.tipo,
      errorMsg: job.errorMsg ?? "Error en job",
    })
    alertas += 1
  }

  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const proyectosAtrasados = await db.proyectoImplementacion.findMany({
    where: {
      estado: "activo",
      fechaObjetivoGoLive: { lt: new Date() },
      faseActual: { not: "CCA-080" },
      updatedAt: { lte: hace24h },
    },
    select: {
      id: true,
      empresaId: true,
      codigo: true,
      faseActual: true,
      fechaObjetivoGoLive: true,
    },
    take: 50,
  })

  for (const p of proyectosAtrasados) {
    if (!p.fechaObjetivoGoLive) continue
    const yaNotificado = await db.sistemaLog.findFirst({
      where: {
        empresaId: p.empresaId,
        contexto: "cron:cca-atraso",
        createdAt: { gte: hace24h },
        mensaje: { contains: p.codigo },
      },
    })
    if (yaNotificado) continue

    void notifyAnalistasImplementacionAtrasada({
      empresaId: p.empresaId,
      proyectoCodigo: p.codigo,
      faseActual: p.faseActual,
      fechaObjetivoGoLive: p.fechaObjetivoGoLive,
    }).catch((e) => console.error("Error al notificar CCA atrasado:", e))
    alertas += 1
  }

  return NextResponse.json({
    ok: true,
    alertas,
    entornosError: entornosError.length,
    proyectosAtrasados: proyectosAtrasados.length,
  })
}