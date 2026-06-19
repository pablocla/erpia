import { prisma } from "@/lib/prisma"
import { runPlaybook } from "./playbook-runner"
import { requireAutomationEntitlement } from "@/lib/platform/entitlements"

/** Evalúa cron estándar 5 campos: min hour dom month dow */
function cronMatchesNow(cron: string | null | undefined): boolean {
  if (!cron) return false
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5) return false

  const now = new Date()
  const minute = now.getMinutes()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()

  const [cronMin, cronHour, , , cronDow] = parts

  if (cronMin !== "*" && parseInt(cronMin, 10) !== minute) return false
  if (cronHour !== "*" && parseInt(cronHour, 10) !== hour) return false

  if (cronDow !== "*") {
    if (cronDow.includes("-")) {
      const [from, to] = cronDow.split("-").map((v) => parseInt(v, 10))
      if (dayOfWeek < from || dayOfWeek > to) return false
    } else if (cronDow.includes(",")) {
      const days = cronDow.split(",").map((v) => parseInt(v, 10))
      if (!days.includes(dayOfWeek)) return false
    } else if (parseInt(cronDow, 10) !== dayOfWeek) {
      return false
    }
  }

  return true
}

export async function runVirtualWorkersForEmpresa(empresaId: number) {
  const access = await requireAutomationEntitlement(empresaId)
  if (!access.ok) return { ran: 0 }

  const config = await prisma.automationConfig.findUnique({
    where: { empresaId },
    include: { virtualWorkers: { where: { activo: true } } },
  })
  if (!config) return { ran: 0 }

  let ran = 0
  for (const worker of config.virtualWorkers) {
    if (!cronMatchesNow(worker.cron)) continue
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