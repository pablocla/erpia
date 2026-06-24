import { prisma } from "@/lib/prisma"

const TERMINAL = new Set(["completado", "error", "cancelado"])

export async function esperarOpsJob(
  jobId: number,
  timeoutMs = 120_000,
  pollMs = 400,
): Promise<{ estado: string; errorMsg: string | null }> {
  const db = prisma as any
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    const job = await db.opsJob.findUnique({ where: { id: jobId } })
    if (!job) throw new Error("Job no encontrado")
    if (TERMINAL.has(job.estado)) {
      return { estado: job.estado, errorMsg: job.errorMsg ?? null }
    }
    await new Promise((r) => setTimeout(r, pollMs))
  }

  throw new Error(`Timeout esperando job #${jobId}`)
}