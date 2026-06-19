/**
 * Worker BullMQ para webhooks salientes NOP → n8n.
 * Ejecutar: npm run worker:automation  (requiere REDIS_URL)
 */
import { Worker } from "bullmq"
import { executeOutboundWebhook } from "../lib/automation/outbound-job"
import {
  AUTOMATION_OUTBOUND_QUEUE,
} from "../lib/automation/queue-constants"

const redisUrl = process.env.REDIS_URL

if (!redisUrl) {
  console.error("[AutomationWorker] REDIS_URL no configurada. Abortando.")
  process.exit(1)
}

const worker = new Worker(
  AUTOMATION_OUTBOUND_QUEUE,
  async (job) => {
    await executeOutboundWebhook(job.data)
  },
  {
    connection: { url: redisUrl },
    concurrency: 5,
  }
)

worker.on("completed", (job) => {
  console.info(`[AutomationWorker] OK ${job.id} → ${job.data.eventKey}`)
})

worker.on("failed", (job, err) => {
  console.error(
    `[AutomationWorker] FAIL ${job?.id} → ${job?.data?.eventKey}:`,
    err.message
  )
})

console.info(`[AutomationWorker] Escuchando cola "${AUTOMATION_OUTBOUND_QUEUE}"…`)