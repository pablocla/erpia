/**
 * Cron: corre empleados digitales activos según su expresión cron.
 */

import { prisma } from "@/lib/prisma"
import { shouldRunInWindow } from "@/lib/ai/agents/cron-matcher"
import { runLeoCobranza } from "@/lib/empleados-digitales/runtime/orchestrator"
import { LEO_COBRANZA_CODE } from "@/lib/empleados-digitales/types"

export async function runScheduledEmpleadosDigitales() {
  const activos = await prisma.empleadoDigital.findMany({
    where: { estado: { in: ["activo", "trial"] } },
    include: { template: { select: { code: true, cronDefault: true } } },
    take: 500,
  })

  const results: Array<{ empresaId: number; code: string; ok: boolean; resumen?: string }> = []

  for (const emp of activos) {
    const cron = emp.cron || emp.template.cronDefault || "0 10 * * 1-5"
    // Ventana de 60 min: el dispatcher free corre each tick / hourly
    if (!shouldRunInWindow(cron, 60)) continue

    try {
      if (emp.template.code === LEO_COBRANZA_CODE) {
        const r = await runLeoCobranza({
          empresaId: emp.empresaId,
          empleadoId: emp.id,
          trigger: "cron",
        })
        results.push({
          empresaId: emp.empresaId,
          code: emp.template.code,
          ok: true,
          resumen: r.resumen,
        })
      }
    } catch (err) {
      console.error(`[empleados-digitales] cron fail empresa=${emp.empresaId}:`, err)
      results.push({
        empresaId: emp.empresaId,
        code: emp.template.code,
        ok: false,
        resumen: err instanceof Error ? err.message : "error",
      })
    }
  }

  return { processed: results.length, results }
}
