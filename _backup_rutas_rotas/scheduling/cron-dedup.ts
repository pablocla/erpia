import { prisma } from "@/lib/prisma"

export function buildPeriodKey(granularity: "tick" | "hour" | "day", now = new Date()): string {
  if (granularity === "tick") {
    const bucket = Math.floor(now.getTime() / (5 * 60_000))
    return `tick-${bucket}`
  }
  if (granularity === "hour") {
    return `${now.toISOString().slice(0, 13)}`
  }
  return now.toISOString().slice(0, 10)
}

export async function wasJobRunInPeriod(
  jobId: string,
  periodKey: string
): Promise<boolean> {
  const existing = await prisma.cronRunLedger.findUnique({
    where: { jobId_periodKey: { jobId, periodKey } },
    select: { id: true },
  })
  return Boolean(existing)
}

export async function recordJobRun(
  jobId: string,
  periodKey: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.cronRunLedger.upsert({
    where: { jobId_periodKey: { jobId, periodKey } },
    create: {
      jobId,
      periodKey,
      status: "ok",
      metadata: (metadata as unknown as import("@prisma/client").Prisma.InputJsonValue) ?? undefined,
    },
    update: {
      status: "ok",
      metadata: (metadata as unknown as import("@prisma/client").Prisma.InputJsonValue) ?? undefined,
    },
  })
}