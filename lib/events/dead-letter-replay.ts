/**
 * Sprint 3 — Reintento de handlers fallidos (dead-letter desde HandlerLog).
 */

import { prisma } from "@/lib/prisma"
import { eventBus } from "@/lib/events/event-bus"
import type { ERPEventType } from "@/lib/events/types"

const MAX_REPLAY_BATCH = 25
const MAX_AGE_HOURS = 72

export type ReplaySummary = {
  scanned: number
  replayed: number
  stillFailing: number
}

export async function replayFailedHandlerLogs(now = new Date()): Promise<ReplaySummary> {
  const since = new Date(now.getTime() - MAX_AGE_HOURS * 60 * 60 * 1000)

  const failed = await prisma.handlerLog.findMany({
    where: {
      exito: false,
      createdAt: { gte: since },
      errorMsg: { not: null },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_REPLAY_BATCH,
  })

  let replayed = 0
  let stillFailing = 0

  for (const row of failed) {
    try {
      const payload = row.payload ? JSON.parse(row.payload) : {}
      const evento = row.evento as ERPEventType
      if (!evento) continue

      await eventBus.emit({
        type: evento,
        payload,
        timestamp: new Date(),
      })
      replayed++
    } catch {
      stillFailing++
    }
  }

  return { scanned: failed.length, replayed, stillFailing }
}