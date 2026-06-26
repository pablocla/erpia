import { prisma } from "@/lib/prisma"
import { getProyectoPorEmpresa } from "@/lib/ops/implementacion-service"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { notifyAnalistasTicketCritico } from "@/lib/ops/ops-notificaciones"

function db() {
  return prisma as any
}

export interface AfipProdPending {
  solicitadoPor: string
  solicitadoAt: string
  estado: "pendiente" | "aprobado" | "rechazado"
  aprobadoPor?: string
  aprobadoAt?: string
}

async function loadMeta(empresaId: number) {
  const proyecto = await getProyectoPorEmpresa(empresaId)
  if (!proyecto) return { proyecto: null, meta: {} as Record<string, unknown> }
  const meta = (proyecto.metadata && typeof proyecto.metadata === "object" ? proyecto.metadata : {}) as Record<string, unknown>
  return { proyecto, meta }
}

async function saveMeta(empresaId: number, meta: Record<string, unknown>) {
  const { proyecto } = await loadMeta(empresaId)
  if (!proyecto) throw new Error("Proyecto de implementación requerido")
  await db().proyectoImplementacion.update({
    where: { empresaId },
    data: { metadata: meta, updatedAt: new Date() },
  })
}

export async function getAfipProdPending(empresaId: number): Promise<AfipProdPending | null> {
  const { meta } = await loadMeta(empresaId)
  const p = meta.afipProdPending
  return p && typeof p === "object" ? (p as AfipProdPending) : null
}

export async function solicitarAfipProduccion(empresaId: number, solicitanteEmail: string) {
  const empresa = await db().empresa.findUnique({
    where: { id: empresaId },
    select: { entornoAfip: true, certificadoCRT: true, nombre: true },
  })
  if (!empresa) throw new Error("Empresa no encontrada")
  if (!empresa.certificadoCRT) throw new Error("Certificado AFIP requerido antes de producción")
  if (empresa.entornoAfip === "produccion") throw new Error("Ya está en producción")

  const { meta } = await loadMeta(empresaId)
  const pending: AfipProdPending = {
    solicitadoPor: solicitanteEmail,
    solicitadoAt: new Date().toISOString(),
    estado: "pendiente",
  }
  await saveMeta(empresaId, { ...meta, afipProdPending: pending })

  await persistSistemaLog({
    empresaId,
    severidad: "warn",
    categoria: "fiscal",
    contexto: "afip:prod-solicitud",
    mensaje: `Solicitud paso a producción AFIP por ${solicitanteEmail}`,
  })

  void notifyAnalistasTicketCritico({
    empresaId,
    ticketId: 0,
    numero: "AFIP-PROD",
    titulo: `Aprobación AFIP producción — ${empresa.nombre}`,
    descripcion: `Solicitante: ${solicitanteEmail}. Requiere segundo analista.`,
  }).catch(() => {})

  return pending
}

export async function aprobarAfipProduccion(
  empresaId: number,
  aprobadorEmail: string,
  opts?: { rechazar?: boolean },
) {
  const pending = await getAfipProdPending(empresaId)
  if (!pending || pending.estado !== "pendiente") {
    throw new Error("No hay solicitud pendiente de AFIP producción")
  }
  if (pending.solicitadoPor.toLowerCase() === aprobadorEmail.toLowerCase()) {
    throw new Error("Aprobación dual: otro analista debe aprobar (no el solicitante)")
  }

  const { meta } = await loadMeta(empresaId)

  if (opts?.rechazar) {
    const next: AfipProdPending = {
      ...pending,
      estado: "rechazado",
      aprobadoPor: aprobadorEmail,
      aprobadoAt: new Date().toISOString(),
    }
    await saveMeta(empresaId, { ...meta, afipProdPending: next })
    return { aplicado: false, estado: "rechazado" }
  }

  await db().empresa.update({
    where: { id: empresaId },
    data: { entornoAfip: "produccion", entorno: "produccion" },
  })

  const next: AfipProdPending = {
    ...pending,
    estado: "aprobado",
    aprobadoPor: aprobadorEmail,
    aprobadoAt: new Date().toISOString(),
  }
  await saveMeta(empresaId, { ...meta, afipProdPending: next })

  await persistSistemaLog({
    empresaId,
    severidad: "info",
    categoria: "fiscal",
    contexto: "afip:prod-aprobado",
    mensaje: `AFIP producción activado. Solicitó ${pending.solicitadoPor}, aprobó ${aprobadorEmail}`,
  })

  return { aplicado: true, estado: "aprobado" }
}