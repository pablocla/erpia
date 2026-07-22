import { prisma } from "@/lib/prisma"
import { assertToolScope, loadTareaScoped } from "../security"
import { recordUsage, checkLeoLimits } from "../metering"
import type { EmpleadoLeoCobranzaConfig, TareaEstado, ToolContext } from "../types"

export async function actualizarEstadoTarea(
  ctx: ToolContext & { userId?: number },
  config: EmpleadoLeoCobranzaConfig,
  input: {
    tareaId: bigint | number
    estado: Extract<TareaEstado, "aprobada" | "rechazada" | "cancelada">
    mensajeEditado?: string
  },
) {
  assertToolScope(ctx, ctx.empresaId, "actualizar_estado")
  const tarea = await loadTareaScoped(ctx.empresaId, input.tareaId)

  if (tarea.estado !== "pendiente" && tarea.estado !== "aprobada") {
    throw new Error(`La tarea ya está en estado ${tarea.estado}`)
  }

  if (input.estado === "aprobada") {
    const limits = await checkLeoLimits(ctx.empresaId, ctx.empleadoId, config, "wa_send")
    if (!limits.ok) throw new Error(limits.message)

    // Marcar WA para envío (cola outbound existente toma estado "aprobado")
    if (tarea.mensajeWaId) {
      await prisma.mensajePendienteWhatsApp.updateMany({
        where: { id: tarea.mensajeWaId, empresaId: ctx.empresaId },
        data: {
          estado: "aprobado",
          ...(input.mensajeEditado ? { mensaje: input.mensajeEditado } : {}),
        },
      })
    }

    const updated = await prisma.empleadoDigitalTarea.update({
      where: { id: tarea.id },
      data: {
        estado: "aprobada",
        aprobadoPorUserId: ctx.userId,
        aprobadoAt: new Date(),
        ...(input.mensajeEditado ? { mensaje: input.mensajeEditado, origenMensaje: "manual" } : {}),
      },
    })

    await recordUsage({
      empresaId: ctx.empresaId,
      empleadoId: ctx.empleadoId,
      runId: tarea.runId && tarea.runId > BigInt(0) ? tarea.runId : undefined,
      kind: "wa_send",
      tool: "enviar_wa_aprobado",
      metadata: { tareaId: String(tarea.id) },
    })

    return updated
  }

  // rechazada / cancelada
  if (tarea.mensajeWaId) {
    await prisma.mensajePendienteWhatsApp.updateMany({
      where: { id: tarea.mensajeWaId, empresaId: ctx.empresaId },
      data: { estado: "descartado" },
    })
  }

  return prisma.empleadoDigitalTarea.update({
    where: { id: tarea.id },
    data: {
      estado: input.estado,
      aprobadoPorUserId: ctx.userId,
      aprobadoAt: new Date(),
    },
  })
}
