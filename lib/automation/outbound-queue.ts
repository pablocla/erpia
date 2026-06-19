import { Queue } from "bullmq"
import {
  AUTOMATION_OUTBOUND_OPTS,
  AUTOMATION_OUTBOUND_QUEUE,
} from "./queue-constants"
import {
  executeOutboundWebhook,
  type OutboundWebhookJob,
} from "./outbound-job"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

let bullQueue: Queue<OutboundWebhookJob> | null = null

function getBullQueue(): Queue<OutboundWebhookJob> | null {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return null

  if (!bullQueue) {
    bullQueue = new Queue<OutboundWebhookJob>(AUTOMATION_OUTBOUND_QUEUE, {
      connection: { url: redisUrl },
      defaultJobOptions: {
        attempts: AUTOMATION_OUTBOUND_OPTS.attempts,
        backoff: AUTOMATION_OUTBOUND_OPTS.backoff,
        removeOnComplete: 200,
        removeOnFail: 500,
      },
    })
  }
  return bullQueue
}

async function runWithRetries(
  job: OutboundWebhookJob,
  maxRetries = AUTOMATION_OUTBOUND_OPTS.attempts
): Promise<void> {
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      await executeOutboundWebhook(job)
      return
    } catch (err) {
      attempt++
      if (attempt >= maxRetries) {
        console.error("[AutomationQueue] job failed after retries:", err)
        return
      }
      await sleep(Math.pow(2, attempt) * 500)
    }
  }
}

const inProcessQueue: OutboundWebhookJob[] = []
let draining = false

async function drainInProcess(): Promise<void> {
  if (draining) return
  draining = true
  while (inProcessQueue.length > 0) {
    const job = inProcessQueue.shift()
    if (!job) break
    await runWithRetries(job)
  }
  draining = false
}

/** Encola webhook saliente — BullMQ si REDIS_URL, sino in-process. */
export async function enqueueOutboundWebhook(job: OutboundWebhookJob): Promise<void> {
  const queue = getBullQueue()
  if (queue) {
    await queue.add("webhook", job, {
      jobId: job.envelope.idempotencyKey,
    })
    return
  }
  inProcessQueue.push(job)
  void drainInProcess()
}

/** @deprecated Usar enqueueOutboundWebhook */
export function enqueueOutbound(job: () => Promise<void>): void {
  void job().catch((err) => console.error("[AutomationQueue] legacy job error:", err))
}