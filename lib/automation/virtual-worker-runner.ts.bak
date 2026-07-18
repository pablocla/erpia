import { prisma } from "@/lib/prisma"
import { shouldRunInWindow } from "@/lib/ai/agents/cron-matcher"
import { getSchedulerWindowMinutes } from "@/lib/scheduling/scheduler-config"
import { runPlaybook } from "./playbook-runner"
import { requireAutomationEntitlement } from "@/lib/platform/entitlements"

function workerRanRecently(lastRunAt: Date | null | undefined, windowMinutes: number, now = new Date()) {
  if (!lastRunAt) return false
  return now.getTime() - lastRunAt.getTime() < windowMinutes * 60_000
}

function cronMatchesNow(cron: string | null | undefined, now = new Date()): boolean {
  if (!cron) return false
  return shouldRunInWindow(cron, getSchedulerWindowMinutes(), now)
}

export async function runVirtualWorkersForEmpresa(empresaId: number) {
  const access = await requireAutomationEntitlement(empresaId)
  if (!access.ok) return { ran: 0 }

  const config = await prisma.automationConfig.findUnique({
    where: { empresaId },
    include: { virtualWorkers: { where: { activo: true } } },
  })
  if (!config) return { ran: 0 }

  const now = new Date()
  const windowMinutes = getSchedulerWindowMinutes()
  let ran = 0
  for (const worker of config.virtualWorkers) {
    if (!cronMatchesNow(worker.cron, now)) continue
    if (workerRanRecently(worker.lastRunAt, windowMinutes, now)) continue
    for (const playbookKey of worker.playbooks) {
      await runPlaybook(empresaId, playbookKey, {
        rolAsignar: worker.rol,
        rol: worker.rol,
      })
    }
    await prisma.automationVirtualWorker.update({
      where: { id: worker.id },
      data: { lastRunAt: new Date() },
    })
    ran++
  }
  return { ran }
}

export async function runAllVirtualWorkers() {
  const configs = await prisma.automationConfig.findMany({
    where: { activo: true },
    select: { empresaId: true },
  })
  let total = 0
  for (const c of configs) {
    const r = await runVirtualWorkersForEmpresa(c.empresaId)
    total += r.ran
  }
  return { total }
}