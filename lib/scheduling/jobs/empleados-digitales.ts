/**
 * Cron: empleados digitales activos.
 * ED-15: runEmpleado genérico · INF-01: máx 50 empresas por tick
 */

import { prisma } from "@/lib/prisma"
import { shouldRunInWindow } from "@/lib/ai/agents/cron-matcher"
import { runEmpleado } from "@/lib/empleados-digitales/runtime/run-empleado"

const MAX_POR_TICK = 50
const CURSOR_KEY = "empleados_digitales_cron_cursor"

export async function runScheduledEmpleadosDigitales() {
  const activos = await prisma.empleadoDigital.findMany({
    where: { estado: { in: ["activo", "trial"] } },
    include: { template: { select: { code: true, cronDefault: true } } },
    orderBy: { id: "asc" },
    take: 2000,
  })

  // Cursor simple en parametro global (empresa 0 no existe → usamos primera empresa sistema o skip)
  let cursorId = 0
  try {
    const cursorRow = await prisma.parametroFiscal.findFirst({
      where: { clave: CURSOR_KEY, pais: "AR" },
      select: { valor: true, id: true, empresaId: true },
      orderBy: { id: "asc" },
    })
    if (cursorRow) cursorId = Number(cursorRow.valor) || 0
  } catch {
    cursorId = 0
  }

  const enVentana = activos.filter((emp) => {
    const cron = emp.cron || emp.template.cronDefault || "0 10 * * 1-5"
    return shouldRunInWindow(cron, 60)
  })

  // Rotar desde cursor
  const sorted = [...enVentana].sort((a, b) => a.id - b.id)
  const startIdx = sorted.findIndex((e) => e.id > cursorId)
  const rotated =
    startIdx < 0
      ? sorted
      : [...sorted.slice(startIdx), ...sorted.slice(0, startIdx)]

  const batch = rotated.slice(0, MAX_POR_TICK)
  const results: Array<{ empresaId: number; code: string; ok: boolean; resumen?: string }> = []

  for (const emp of batch) {
    try {
      const r = await runEmpleado({
        empresaId: emp.empresaId,
        code: emp.template.code,
        empleadoId: emp.id,
        trigger: "cron",
      })
      results.push({
        empresaId: emp.empresaId,
        code: emp.template.code,
        ok: true,
        resumen: r.resumen,
      })
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

  // Persistir cursor (best-effort en cualquier empresa del batch)
  const last = batch[batch.length - 1]
  if (last) {
    try {
      const host = await prisma.empresa.findFirst({
        where: { deletedAt: null },
        select: { id: true },
        orderBy: { id: "asc" },
      })
      if (host) {
        await prisma.parametroFiscal.upsert({
          where: {
            empresaId_clave_pais: {
              empresaId: host.id,
              clave: CURSOR_KEY,
              pais: "AR",
            },
          },
          update: { valor: last.id },
          create: {
            empresaId: host.id,
            clave: CURSOR_KEY,
            valor: last.id,
            descripcion: "Cursor cron empleados digitales",
            categoria: "ops",
            pais: "AR",
          },
        })
      }
    } catch {
      /* ignore cursor errors */
    }
  }

  return {
    processed: results.length,
    maxPorTick: MAX_POR_TICK,
    totalEnVentana: enVentana.length,
    results,
  }
}
