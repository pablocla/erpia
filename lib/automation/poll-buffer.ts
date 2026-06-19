import { prisma } from "@/lib/prisma"
import type { SignedEnvelope } from "./sign-payload"

export interface PollQueueItem {
  id: string
  eventKey: string
  envelope: SignedEnvelope
  idempotencyKey?: string
  createdAt: string
}

const memoryBuffer = new Map<number, PollQueueItem[]>()
const MAX_MEMORY_PER_EMPRESA = 500

export async function enqueuePollEvent(
  empresaId: number,
  eventKey: string,
  envelope: SignedEnvelope
): Promise<void> {
  const item: PollQueueItem = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventKey,
    envelope,
    idempotencyKey: envelope.idempotencyKey,
    createdAt: new Date().toISOString(),
  }

  const list = memoryBuffer.get(empresaId) ?? []
  list.push(item)
  if (list.length > MAX_MEMORY_PER_EMPRESA) {
    list.splice(0, list.length - MAX_MEMORY_PER_EMPRESA)
  }
  memoryBuffer.set(empresaId, list)

  try {
    await prisma.automationPollQueue.create({
      data: {
        empresaId,
        eventKey,
        envelope: envelope as object,
        idempotencyKey: envelope.idempotencyKey,
      },
    })
  } catch {
    // DB opcional en tests / entornos sin migración
  }
}

export async function fetchPendingPollEvents(
  empresaId: number,
  limit = 50
): Promise<{ events: PollQueueItem[]; hasMore: boolean }> {
  try {
    const rows = await prisma.automationPollQueue.findMany({
      where: { empresaId, delivered: false },
      orderBy: { createdAt: "asc" },
      take: limit + 1,
    })
    if (rows.length > 0) {
      const hasMore = rows.length > limit
      const slice = rows.slice(0, limit)
      return {
        hasMore,
        events: slice.map((r) => ({
          id: String(r.id),
          eventKey: r.eventKey,
          envelope: r.envelope as SignedEnvelope,
          idempotencyKey: r.idempotencyKey ?? undefined,
          createdAt: r.createdAt.toISOString(),
        })),
      }
    }
  } catch {
    // fallback memoria
  }

  const mem = memoryBuffer.get(empresaId) ?? []
  const hasMore = mem.length > limit
  return {
    hasMore,
    events: mem.slice(0, limit),
  }
}

export async function acknowledgePollEvents(
  empresaId: number,
  ids: string[]
): Promise<number> {
  if (ids.length === 0) return 0

  const mem = memoryBuffer.get(empresaId) ?? []
  const idSet = new Set(ids)
  const remaining = mem.filter((e) => !idSet.has(e.id))
  memoryBuffer.set(empresaId, remaining)

  const numericIds = ids
    .map((id) => (/^\d+$/.test(id) ? BigInt(id) : null))
    .filter((id): id is bigint => id != null)

  if (numericIds.length === 0) {
    return ids.length - remaining.length
  }

  try {
    const result = await prisma.automationPollQueue.updateMany({
      where: {
        empresaId,
        id: { in: numericIds },
        delivered: false,
      },
      data: {
        delivered: true,
        deliveredAt: new Date(),
      },
    })
    return result.count
  } catch {
    return ids.length
  }
}

export function clearPollMemoryForTests(): void {
  memoryBuffer.clear()
}