/**
 * Sprint 3 — Recordatorios de renovación / activación de plan (3 días antes del trial).
 */

import { prisma } from "@/lib/prisma"
import { getTrialStatus } from "@/lib/comercial/trial-service"
import { persistSistemaLog } from "@/lib/ops/sistema-log"

export type RenovacionAbonoSummary = {
  empresasRevisadas: number
  avisosTrial: number
  avisosMpPendiente: number
}

export async function runRenovacionAbonos(): Promise<RenovacionAbonoSummary> {
  const empresas = await prisma.empresa.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      nombre: true,
      mpSubscriptionStatus: true,
      usuarios: { take: 1, select: { email: true } },
    },
    take: 500,
  })

  let avisosTrial = 0
  let avisosMpPendiente = 0

  for (const emp of empresas) {
    if (emp.mpSubscriptionStatus === "authorized") continue

    const trial = await getTrialStatus(emp.id)
    if (trial?.activo && trial.diasRestantes <= 3 && trial.diasRestantes > 0) {
      avisosTrial++
      await persistSistemaLog({
        empresaId: emp.id,
        severidad: "warn",
        categoria: "comercial",
        contexto: "renovacion-abono",
        mensaje: `Trial vence en ${trial.diasRestantes}d — activar plan`,
        metadata: {
          diasRestantes: trial.diasRestantes,
          accion: "mi_plan",
          href: "/dashboard/mi-plan",
        },
      })
    }

    if (emp.mpSubscriptionStatus === "pending") {
      avisosMpPendiente++
      await persistSistemaLog({
        empresaId: emp.id,
        severidad: "info",
        categoria: "comercial",
        contexto: "renovacion-abono",
        mensaje: "Suscripción Mercado Pago pendiente de autorización",
        metadata: { accion: "completar_mp", href: "/dashboard/mi-plan" },
      })
    }
  }

  return {
    empresasRevisadas: empresas.length,
    avisosTrial,
    avisosMpPendiente,
  }
}