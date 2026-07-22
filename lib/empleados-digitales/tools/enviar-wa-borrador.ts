import { prisma } from "@/lib/prisma"
import { assertToolScope } from "../security"
import { recordUsage, checkLeoLimits } from "../metering"
import type { DeudaItem, EmpleadoLeoCobranzaConfig, OrigenMensaje, ToolContext } from "../types"

export async function enviarWaBorrador(
  ctx: ToolContext,
  config: EmpleadoLeoCobranzaConfig,
  input: {
    deuda: DeudaItem
    mensaje: string
    origenMensaje: OrigenMensaje
    prioridad?: number
  },
): Promise<{ tareaId: bigint; mensajeWaId: number }> {
  assertToolScope(ctx, ctx.empresaId, "enviar_wa_borrador")

  const limits = await checkLeoLimits(ctx.empresaId, ctx.empleadoId, config, "wa_draft")
  if (!limits.ok) {
    throw new Error(limits.message)
  }

  // Canal WA reutilizando cola existente (siempre pendiente = borrador)
  const wa = await prisma.mensajePendienteWhatsApp.create({
    data: {
      empresaId: ctx.empresaId,
      destinatario: input.deuda.clienteNombre,
      telefono: input.deuda.telefono,
      mensaje: input.mensaje,
      tipo: "cobranza",
      prioridad: input.prioridad ?? Math.min(10, Math.round(input.deuda.score / 10)),
      estado: "pendiente",
    },
  })

  const tarea = await prisma.empleadoDigitalTarea.create({
    data: {
      empresaId: ctx.empresaId,
      empleadoDigitalId: ctx.empleadoId,
      runId: ctx.runId,
      tipo: "wa_borrador",
      estado: "pendiente",
      prioridad: wa.prioridad,
      clienteId: input.deuda.clienteId,
      montoArs: input.deuda.montoArs,
      diasVencido: input.deuda.diasVencido,
      telefono: input.deuda.telefono,
      mensaje: input.mensaje,
      origenMensaje: input.origenMensaje,
      mensajeWaId: wa.id,
      payload: {
        cuentaIds: input.deuda.cuentaIds,
        score: input.deuda.score,
      },
    },
  })

  await recordUsage({
    empresaId: ctx.empresaId,
    empleadoId: ctx.empleadoId,
    runId: ctx.runId,
    kind: "wa_draft",
    tool: "enviar_wa_borrador",
    metadata: { clienteId: input.deuda.clienteId, mensajeWaId: wa.id },
  })

  return { tareaId: tarea.id, mensajeWaId: wa.id }
}
