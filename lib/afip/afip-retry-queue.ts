/**
 * Cola de reintento CAE AFIP.
 * Usa BullMQ si REDIS_URL está definido; si no, fallback in-process + cron sync-pendientes.
 */

import { Queue } from "bullmq"
import { solicitarCaeFactura } from "@/lib/afip/solicitar-cae-factura"

export const AFIP_RETRY_QUEUE = "afip-retry-queue"

export interface AfipRetryJob {
  facturaId: number
  empresaId: number
  attempt?: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

let bullQueue: Queue<AfipRetryJob> | null = null

function getBullQueue(): Queue<AfipRetryJob> | null {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  if (!bullQueue) {
    bullQueue = new Queue<AfipRetryJob>(AFIP_RETRY_QUEUE, {
      connection: { url: redisUrl },
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "custom",
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    })
  }
  return bullQueue
}

/** Backoff: 1min, 5min, 15min, 1h, 2h */
export function afipRetryDelayMs(attempt: number): number {
  const table = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 2 * 60 * 60_000]
  return table[Math.min(Math.max(attempt, 0), table.length - 1)] ?? 60_000
}

async function processJob(job: AfipRetryJob): Promise<void> {
  const result = await solicitarCaeFactura(job.facturaId)
  if (!result.ok) {
    throw new Error(result.error ?? "CAE no obtenido")
  }
}

const inProcess: AfipRetryJob[] = []
let draining = false

async function drainInProcess(): Promise<void> {
  if (draining) return
  draining = true
  while (inProcess.length > 0) {
    const job = inProcess.shift()
    if (!job) break
    const attempt = job.attempt ?? 0
    try {
      await processJob(job)
    } catch (err) {
      if (attempt < 4) {
        await sleep(Math.min(afipRetryDelayMs(attempt), 5_000))
        inProcess.push({ ...job, attempt: attempt + 1 })
      } else {
        console.error("[afip-retry-queue] falló tras reintentos:", job.facturaId, err)
      }
    }
  }
  draining = false
}

/**
 * Encola reintento de CAE para una factura en pendiente_cae.
 */
export async function enqueueAfipRetry(job: AfipRetryJob): Promise<{ queued: boolean; mode: "bullmq" | "inprocess" }> {
  const queue = getBullQueue()
  if (queue) {
    await queue.add(
      "retry-cae",
      job,
      {
        jobId: `afip-cae-${job.facturaId}`,
        delay: afipRetryDelayMs(job.attempt ?? 0),
      },
    )
    return { queued: true, mode: "bullmq" }
  }

  inProcess.push(job)
  void drainInProcess()
  return { queued: true, mode: "inprocess" }
}
