import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import {
  PLAYBOOK_TEMPLATES,
  VIRTUAL_WORKER_TEMPLATES,
} from "./virtual-workers-catalog"

export async function getOrCreateConfig(empresaId: number) {
  const existing = await prisma.automationConfig.findUnique({
    where: { empresaId },
    include: {
      eventMaps: true,
      playbooks: true,
      virtualWorkers: true,
    },
  })
  if (existing) return existing

  const secret = randomBytes(32).toString("hex")
  return prisma.automationConfig.create({
    data: {
      empresaId,
      webhookSecret: secret,
      activo: false,
    },
    include: {
      eventMaps: true,
      playbooks: true,
      virtualWorkers: true,
    },
  })
}

export async function updateConfig(
  empresaId: number,
  data: {
    n8nBaseUrl?: string | null
    n8nApiKey?: string | null
    webhookSecret?: string
    activo?: boolean
    metadata?: Record<string, unknown>
  }
) {
  await getOrCreateConfig(empresaId)
  return prisma.automationConfig.update({
    where: { empresaId },
    data: {
      n8nBaseUrl: data.n8nBaseUrl,
      n8nApiKeyEnc: data.n8nApiKey
        ? Buffer.from(data.n8nApiKey).toString("base64")
        : undefined,
      webhookSecret: data.webhookSecret,
      activo: data.activo,
      metadata: data.metadata as object | undefined,
    },
    include: { eventMaps: true, playbooks: true, virtualWorkers: true },
  })
}

export async function upsertEventMap(
  empresaId: number,
  eventKey: string,
  n8nWebhookUrl: string,
  activo = true
) {
  const config = await getOrCreateConfig(empresaId)
  return prisma.automationEventMap.upsert({
    where: {
      configId_eventKey: { configId: config.id, eventKey },
    },
    create: {
      configId: config.id,
      eventKey,
      n8nWebhookUrl,
      activo,
    },
    update: { n8nWebhookUrl, activo },
  })
}

export async function logExecution(params: {
  empresaId: number
  direction: "outbound" | "inbound"
  eventKey?: string
  status: "ok" | "error" | "timeout" | "skipped"
  requestPayload?: unknown
  responsePayload?: unknown
  durationMs?: number
  idempotencyKey?: string
}) {
  try {
    return await prisma.automationExecution.create({
      data: {
        empresaId: params.empresaId,
        direction: params.direction,
        eventKey: params.eventKey,
        status: params.status,
        requestPayload: params.requestPayload as object | undefined,
        responsePayload: params.responsePayload as object | undefined,
        durationMs: params.durationMs,
        idempotencyKey: params.idempotencyKey,
      },
    })
  } catch {
    return null
  }
}

export async function seedAutomationDefaults(empresaId: number, force = false) {
  const config = await getOrCreateConfig(empresaId)
  if (!force && config.playbooks.length > 0 && config.virtualWorkers.length > 0) {
    return {
      seeded: false,
      reason: "already_seeded",
      playbooks: config.playbooks.length,
      workers: config.virtualWorkers.length,
    }
  }

  for (const pb of PLAYBOOK_TEMPLATES) {
    await upsertPlaybook(empresaId, pb)
  }

  const existingWorkers = await prisma.automationVirtualWorker.count({
    where: { configId: config.id },
  })
  if (force || existingWorkers === 0) {
    for (const worker of VIRTUAL_WORKER_TEMPLATES) {
      await upsertVirtualWorker(empresaId, {
        nombre: worker.nombre,
        rol: worker.rol,
        playbooks: worker.playbooks,
        cron: worker.cron,
        activo: worker.activo,
      })
    }
  }

  return {
    seeded: true,
    playbooks: PLAYBOOK_TEMPLATES.length,
    workers: VIRTUAL_WORKER_TEMPLATES.length,
  }
}

export function maskConfigForClient(
  config: Awaited<ReturnType<typeof getOrCreateConfig>>
) {
  return {
    id: config.id,
    empresaId: config.empresaId,
    n8nBaseUrl: config.n8nBaseUrl,
    n8nApiKeySet: Boolean(config.n8nApiKeyEnc),
    webhookSecret: config.webhookSecret,
    activo: config.activo,
    metadata: config.metadata,
    eventMaps: config.eventMaps,
    playbooks: config.playbooks,
    virtualWorkers: config.virtualWorkers,
    updatedAt: config.updatedAt,
  }
}

export async function listExecutions(empresaId: number, take = 50) {
  return prisma.automationExecution.findMany({
    where: { empresaId },
    orderBy: { createdAt: "desc" },
    take,
  })
}

export async function upsertPlaybook(
  empresaId: number,
  data: {
    playbookKey: string
    nombre: string
    parametros?: Record<string, unknown>
    activo?: boolean
  }
) {
  const config = await getOrCreateConfig(empresaId)
  return prisma.automationPlaybook.upsert({
    where: {
      configId_playbookKey: { configId: config.id, playbookKey: data.playbookKey },
    },
    create: {
      configId: config.id,
      playbookKey: data.playbookKey,
      nombre: data.nombre,
      parametros: (data.parametros ?? {}) as object,
      activo: data.activo ?? true,
    },
    update: {
      nombre: data.nombre,
      parametros: data.parametros as object | undefined,
      activo: data.activo,
    },
  })
}

export async function upsertVirtualWorker(
  empresaId: number,
  data: {
    id?: number
    nombre: string
    rol: string
    playbooks: string[]
    cron?: string | null
    activo?: boolean
  }
) {
  const config = await getOrCreateConfig(empresaId)
  if (data.id) {
    return prisma.automationVirtualWorker.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        rol: data.rol,
        playbooks: data.playbooks,
        cron: data.cron,
        activo: data.activo,
      },
    })
  }
  return prisma.automationVirtualWorker.create({
    data: {
      configId: config.id,
      nombre: data.nombre,
      rol: data.rol,
      playbooks: data.playbooks,
      cron: data.cron,
      activo: data.activo ?? true,
    },
  })
}

export async function resolveAutomationApiUser(empresaId: number) {
  let user = await prisma.usuario.findFirst({
    where: { empresaId, esVirtual: true, email: { contains: "automation@" } },
  })
  if (user) return user

  const email = `automation+${empresaId}@nop.local`
  const password = await bcrypt.hash(randomBytes(24).toString("hex"), 10)
  return prisma.usuario.create({
    data: {
      empresaId,
      nombre: "NOP Automation",
      email,
      password,
      rol: "admin",
      esVirtual: true,
      activo: true,
    },
  })
}