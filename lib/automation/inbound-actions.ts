import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { resolveAutomationApiUser, logExecution } from "./automation-service"
import { runPlaybook } from "./playbook-runner"

const PRIORIDAD_MAP: Record<string, string> = {
  baja: "baja",
  media: "media",
  alta: "alta",
  bloqueante: "urgente",
  urgente: "urgente",
}

export async function createAutomationTask(
  empresaId: number,
  data: {
    titulo?: string
    descripcion: string
    rolAsignado: string
    prioridad?: string
  }
) {
  const usuario = await prisma.usuario.findFirst({
    where: { empresaId, rol: data.rolAsignado, activo: true },
    orderBy: { id: "asc" },
  })
  const assignee = usuario ?? (await resolveAutomationApiUser(empresaId))
  const prioridad = PRIORIDAD_MAP[data.prioridad ?? "media"] ?? "media"

  const tarea = await prisma.tareaPendiente.create({
    data: {
      empresaId,
      usuarioId: assignee.id,
      titulo: data.titulo ?? data.descripcion.slice(0, 120),
      descripcion: data.descripcion,
      prioridad,
      origen: "automation",
      visibleJefe: true,
    },
  })

  await logExecution({
    empresaId,
    direction: "inbound",
    eventKey: "CREATE_TASK",
    status: "ok",
    requestPayload: data,
    responsePayload: { tareaId: tarea.id },
  })

  return tarea
}

export async function createVirtualAutomationUser(
  empresaId: number,
  data: { nombre: string; rol: string }
) {
  const slug = data.nombre
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 24)
  const email = `bot-${slug}-${empresaId}@nop.local`
  const apiKey = `nop_${randomBytes(24).toString("hex")}`
  const password = await bcrypt.hash(randomBytes(24).toString("hex"), 10)
  const apiKeyHash = await bcrypt.hash(apiKey, 10)

  const existing = await prisma.usuario.findUnique({ where: { email } })
  if (existing) {
    await prisma.usuario.update({
      where: { id: existing.id },
      data: {
        nombre: data.nombre,
        rol: data.rol,
        esVirtual: true,
        automationApiKeyHash: apiKeyHash,
        activo: true,
      },
    })
    await logExecution({
      empresaId,
      direction: "inbound",
      eventKey: "CREATE_USER_VIRTUAL",
      status: "ok",
      requestPayload: { nombre: data.nombre, rol: data.rol },
      responsePayload: { usuarioId: existing.id, renewed: true },
    })
    return { usuario: existing, apiKey }
  }

  const usuario = await prisma.usuario.create({
    data: {
      empresaId,
      nombre: data.nombre,
      email,
      password,
      rol: data.rol,
      esVirtual: true,
      automationApiKeyHash: apiKeyHash,
      activo: true,
    },
  })

  await logExecution({
    empresaId,
    direction: "inbound",
    eventKey: "CREATE_USER_VIRTUAL",
    status: "ok",
    requestPayload: data,
    responsePayload: { usuarioId: usuario.id },
  })

  return { usuario, apiKey }
}

export async function triggerPlaybookAction(
  empresaId: number,
  playbookKey: string,
  parametros: Record<string, unknown> = {}
) {
  const result = await runPlaybook(empresaId, playbookKey, parametros)
  await logExecution({
    empresaId,
    direction: "inbound",
    eventKey: "TRIGGER_PLAYBOOK",
    status: result.ok ? "ok" : "error",
    requestPayload: { playbookKey, parametros },
    responsePayload: result,
  })
  return result
}

export async function handleInboundAction(
  empresaId: number,
  action: string,
  data: Record<string, unknown>
) {
  switch (action) {
    case "create_task":
      return createAutomationTask(empresaId, {
        titulo: data.titulo as string | undefined,
        descripcion: String(data.descripcion ?? data.titulo ?? ""),
        rolAsignado: String(data.rolAsignado ?? data.rol ?? "gerente"),
        prioridad: data.prioridad as string | undefined,
      })
    case "create_user_virtual":
      return createVirtualAutomationUser(empresaId, {
        nombre: String(data.nombre ?? "Bot NOP"),
        rol: String(data.rol ?? "deposito"),
      })
    case "trigger_playbook":
      return triggerPlaybookAction(
        empresaId,
        String(data.playbookKey ?? ""),
        (data.parametros as Record<string, unknown>) ?? {}
      )
    default:
      throw new Error(`Acción no soportada: ${action}`)
  }
}