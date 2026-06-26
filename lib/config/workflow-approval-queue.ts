/**
 * Cola de aprobaciones para workflows — pausa instancias hasta decisión humana.
 */

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export interface WorkflowApprovalParams {
  titulo?: string
  rolRequerido?: string
  usuarioIdRequerido?: number
  montoUmbral?: number
  timeoutHoras?: number
}

export interface WorkflowApprovalPending {
  stepKey: string
  titulo: string
  rolRequerido?: string
  usuarioIdRequerido?: number
  montoUmbral?: number
  solicitadoAt: string
  expiresAt?: string
}

export interface ResolverAprobacionInput {
  aprobado: boolean
  userId?: number
  comentario?: string
}

export function construirSolicitudAprobacion(
  stepKey: string,
  contexto: Record<string, unknown>,
  params: WorkflowApprovalParams = {},
): WorkflowApprovalPending {
  const timeoutHoras = params.timeoutHoras ?? 72
  const expiresAt = new Date(Date.now() + timeoutHoras * 3600_000).toISOString()

  return {
    stepKey,
    titulo: params.titulo ?? `Aprobación requerida: ${stepKey}`,
    rolRequerido: params.rolRequerido,
    usuarioIdRequerido: params.usuarioIdRequerido,
    montoUmbral: params.montoUmbral ?? (contexto.total as number | undefined),
    solicitadoAt: new Date().toISOString(),
    expiresAt,
  }
}

export async function listarAprobacionesPendientes(empresaId: number) {
  const instancias = await prisma.workflowInstancia.findMany({
    where: { empresaId, estado: "pausado" },
    orderBy: { updatedAt: "desc" },
    take: 100,
  })

  return instancias
    .map((i) => {
      const ctx = (i.contexto ?? {}) as Record<string, unknown>
      const approval = ctx.approvalPending as WorkflowApprovalPending | undefined
      if (!approval) return null
      return {
        instanciaId: i.id,
        proceso: i.proceso,
        entidadTipo: i.entidadTipo,
        entidadId: i.entidadId,
        stepKey: i.stepActual,
        approval,
        contexto: ctx,
      }
    })
    .filter(Boolean)
}

export async function resolverAprobacionWorkflow(
  empresaId: number,
  instanciaId: number,
  input: ResolverAprobacionInput,
): Promise<{ estado: string; instanciaId: number }> {
  const instancia = await prisma.workflowInstancia.findFirst({
    where: { id: instanciaId, empresaId, estado: "pausado" },
  })
  if (!instancia) throw new Error("Instancia no encontrada o no está pendiente de aprobación")

  const ctx = (instancia.contexto ?? {}) as Record<string, unknown>
  const approval = ctx.approvalPending as WorkflowApprovalPending | undefined
  if (!approval) throw new Error("La instancia no tiene solicitud de aprobación activa")

  const nuevoContexto: Record<string, unknown> = {
    ...ctx,
    approvalResolved: {
      aprobado: input.aprobado,
      userId: input.userId,
      comentario: input.comentario,
      resolvedAt: new Date().toISOString(),
      stepKey: approval.stepKey,
    },
    approvalPending: undefined,
  }

  if (!input.aprobado) {
    await prisma.workflowInstancia.update({
      where: { id: instanciaId },
      data: {
        estado: "cancelado",
        error: input.comentario ?? "Aprobación rechazada",
        contexto: nuevoContexto as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    })
    await prisma.workflowPasoLog.create({
      data: {
        instanciaId,
        stepKey: approval.stepKey,
        resultado: "rechazado",
        output: { aprobado: false, comentario: input.comentario } as Prisma.InputJsonValue,
      },
    })
    return { estado: "cancelado", instanciaId }
  }

  await prisma.workflowInstancia.update({
    where: { id: instanciaId },
    data: {
      estado: "en_curso",
      contexto: nuevoContexto as Prisma.InputJsonValue,
      error: null,
    },
  })
  await prisma.workflowPasoLog.create({
    data: {
      instanciaId,
      stepKey: approval.stepKey,
      resultado: "aprobado",
      output: { aprobado: true, userId: input.userId } as Prisma.InputJsonValue,
    },
  })

  return { estado: "en_curso", instanciaId }
}