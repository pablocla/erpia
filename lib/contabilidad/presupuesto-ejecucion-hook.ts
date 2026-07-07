/**
 * Wire B6 — actualiza presupuesto ejecutado al contabilizar egresos.
 */

import { registrarEjecucion } from "@/lib/presupuesto/presupuesto-service"
import type { MovimientoCreateData } from "@/lib/contabilidad/movimiento-builder"

export async function notificarEjecucionPresupuesto(params: {
  empresaId: number
  fecha: Date
  movimientos: MovimientoCreateData[]
}): Promise<void> {
  const mes = params.fecha.getMonth() + 1
  const ejercicio = params.fecha.getFullYear()

  for (const m of params.movimientos) {
    if (m.debe <= 0 || !m.cuentaContableId) continue
    try {
      await registrarEjecucion({
        empresaId: params.empresaId,
        cuentaContableId: m.cuentaContableId,
        centroCostoId: m.centroCostoId ?? undefined,
        mes,
        ejercicio,
        monto: m.debe,
      })
    } catch {
      // Presupuesto es opcional — no bloquear el asiento
    }
  }
}