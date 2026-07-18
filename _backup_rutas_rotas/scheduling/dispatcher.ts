import { buildPeriodKey, recordJobRun, wasJobRunInPeriod } from "./cron-dedup"
import { CRON_JOBS, getJobsForTier, isJobDue, type CronJobDefinition } from "./cron-registry"
import {
  getSchedulerProvider,
  getSchedulerTier,
  getSchedulerWindowMinutes,
} from "./scheduler-config"

export type DispatchJobResult = {
  id: string
  label: string
  status: "ok" | "skipped" | "error"
  reason?: string
  result?: unknown
  durationMs: number
}

export type DispatchSummary = {
  ok: true
  timestamp: string
  provider: ReturnType<typeof getSchedulerProvider>
  tier: ReturnType<typeof getSchedulerTier>
  windowMinutes: number
  executed: number
  skipped: number
  errors: number
  jobs: DispatchJobResult[]
}

async function executeJob(job: CronJobDefinition, now: Date): Promise<DispatchJobResult> {
  const started = Date.now()

  if (!isJobDue(job, now)) {
    return {
      id: job.id,
      label: job.label,
      status: "skipped",
      reason: "not_due",
      durationMs: Date.now() - started,
    }
  }

  if (job.dedup) {
    const periodKey = buildPeriodKey(job.dedup, now)
    if (await wasJobRunInPeriod(job.id, periodKey)) {
      return {
        id: job.id,
        label: job.label,
        status: "skipped",
        reason: "already_ran",
        durationMs: Date.now() - started,
      }
    }
  }

  try {
    const result = await job.run()
    if (job.dedup) {
      await recordJobRun(job.id, buildPeriodKey(job.dedup, now), {
        result: typeof result === "object" ? result : { value: result },
      })
    }
    return {
      id: job.id,
      label: job.label,
      status: "ok",
      result,
      durationMs: Date.now() - started,
    }
  } catch (error) {
    return {
      id: job.id,
      label: job.label,
      status: "error",
      reason: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started,
    }
  }
}

export async function dispatchScheduledJobs(now = new Date()): Promise<DispatchSummary> {
  const tier = getSchedulerTier()
  const jobs = getJobsForTier(tier)
  const results: DispatchJobResult[] = []

  for (const job of jobs) {
    results.push(await executeJob(job, now))
  }

  return {
    ok: true,
    timestamp: now.toISOString(),
    provider: getSchedulerProvider(),
    tier,
    windowMinutes: getSchedulerWindowMinutes(),
    executed: results.filter((r) => r.status === "ok").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    jobs: results,
  }
}

export function listCronJobs() {
  return CRON_JOBS.map((job) => ({
    id: job.id,
    label: job.label,
    tier: job.tier,
    everyTick: job.everyTick ?? false,
    schedule: job.schedule ?? null,
  }))
}