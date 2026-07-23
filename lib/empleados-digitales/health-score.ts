/**
 * PV-02: Health score de adopción (0–100) para success / postventa.
 * Señales: Leo activo, corridas, drafts, enviados, clientes con tel, deudas, POS reciente.
 */

import { prisma } from "@/lib/prisma"
import { isLeoActivo } from "./is-leo-activo"
import { LEO_COBRANZA_CODE } from "./types"
import { getLeoKpis } from "./kpi-service"

export type HealthReason = {
  code: string
  label: string
  points: number
  ok: boolean
}

export type TenantHealthScore = {
  score: number
  grade: "A" | "B" | "C" | "D" | "F"
  reasons: HealthReason[]
  kpis?: {
    deudaRadar: number
    draftsPendientes: number
    enviadosMes: number
    recoveryMes: number
  }
  recommendedActions: string[]
}

function grade(score: number): TenantHealthScore["grade"] {
  if (score >= 85) return "A"
  if (score >= 70) return "B"
  if (score >= 50) return "C"
  if (score >= 30) return "D"
  return "F"
}

export async function computeTenantHealthScore(empresaId: number): Promise<TenantHealthScore> {
  const reasons: HealthReason[] = []
  let score = 0

  const leoOn = await isLeoActivo(empresaId)
  reasons.push({
    code: "leo_activo",
    label: "Leo activo o en trial",
    points: 20,
    ok: leoOn,
  })
  if (leoOn) score += 20

  const emp = await prisma.empleadoDigital.findFirst({
    where: {
      empresaId,
      estado: { in: ["activo", "trial"] },
      template: { code: LEO_COBRANZA_CODE },
    },
    select: {
      id: true,
      estado: true,
      runsTotal: true,
      tokensMes: true,
      accionesMes: true,
      lastRunAt: true,
      lastSuccessAt: true,
      config: true,
    },
  })

  if (emp) {
    const hasRuns = (emp.runsTotal ?? 0) > 0
    reasons.push({
      code: "leo_corridas",
      label: "Al menos 1 corrida de Leo",
      points: 15,
      ok: hasRuns,
    })
    if (hasRuns) score += 15

    const recent =
      emp.lastRunAt && Date.now() - emp.lastRunAt.getTime() < 14 * 86_400_000
    reasons.push({
      code: "leo_reciente",
      label: "Corrida en los últimos 14 días",
      points: 10,
      ok: Boolean(recent),
    })
    if (recent) score += 10

    const kpis = await getLeoKpis({
      empresaId,
      empleadoId: emp.id,
      estado: emp.estado,
      config: emp.config,
      tokensMes: emp.tokensMes,
    })

    const enviados = kpis.enviadosMes > 0
    reasons.push({
      code: "wa_enviados",
      label: "Al menos 1 WhatsApp aprobado este mes",
      points: 15,
      ok: enviados,
    })
    if (enviados) score += 15

    const cobertura =
      kpis.deudoresEnRadar === 0 ||
      kpis.sinTelefono / Math.max(1, kpis.deudoresEnRadar) < 0.4
    reasons.push({
      code: "cobertura_tel",
      label: "Menos del 40% de deudores sin teléfono",
      points: 10,
      ok: cobertura,
    })
    if (cobertura) score += 10

    // Clientes con teléfono
    const [conTel, totalCli] = await Promise.all([
      prisma.cliente.count({
        where: {
          empresaId,
          activo: true,
          deletedAt: null,
          OR: [{ telefono: { not: null } }, { telefonoAlternativo: { not: null } }],
        },
      }),
      prisma.cliente.count({
        where: { empresaId, activo: true, deletedAt: null },
      }),
    ])
    const telOk = totalCli === 0 || conTel / totalCli >= 0.3
    reasons.push({
      code: "clientes_tel",
      label: "≥30% clientes con teléfono cargado",
      points: 10,
      ok: telOk,
    })
    if (telOk) score += 10

    // POS / caja reciente (señal de negocio vivo)
    const hace7 = new Date(Date.now() - 7 * 86_400_000)
    const ventasRecientes = await prisma.factura.count({
      where: {
        empresaId,
        createdAt: { gte: hace7 },
        estado: { not: "anulada" },
      },
    })
    const posOk = ventasRecientes > 0
    reasons.push({
      code: "actividad_7d",
      label: "Facturas/tickets en últimos 7 días",
      points: 10,
      ok: posOk,
    })
    if (posOk) score += 10

    // Recovery o al menos drafts pendientes (pipeline vivo)
    const pipeline =
      kpis.draftsPendientes > 0 || kpis.arsRecuperadosMes > 0 || kpis.enviadosMes > 0
    reasons.push({
      code: "pipeline_cobranza",
      label: "Pipeline de cobranza activo (drafts/envíos/recovery)",
      points: 10,
      ok: pipeline,
    })
    if (pipeline) score += 10

    const recommendedActions: string[] = []
    if (!leoOn) recommendedActions.push("Activar Leo en Empleados digitales")
    if (!hasRuns) recommendedActions.push("Correr vista previa y luego una corrida real")
    if (!enviados) recommendedActions.push("Aprobar al menos un borrador de WhatsApp")
    if (!cobertura || !telOk) recommendedActions.push("Completar teléfonos de clientes con deuda")
    if (!posOk) recommendedActions.push("Registrar ventas en POS para mantener el negocio activo")
    if (kpis.arsRecuperadosMes === 0 && enviados)
      recommendedActions.push("Seguir pagos 7 días post-envío (KPI recovery)")

    return {
      score: Math.min(100, score),
      grade: grade(score),
      reasons,
      kpis: {
        deudaRadar: kpis.deudaEnRadarArs,
        draftsPendientes: kpis.draftsPendientes,
        enviadosMes: kpis.enviadosMes,
        recoveryMes: kpis.arsRecuperadosMes,
      },
      recommendedActions: recommendedActions.slice(0, 5),
    }
  }

  // Sin instancia Leo
  reasons.push(
    {
      code: "leo_corridas",
      label: "Al menos 1 corrida de Leo",
      points: 15,
      ok: false,
    },
    {
      code: "leo_reciente",
      label: "Corrida en los últimos 14 días",
      points: 10,
      ok: false,
    },
  )

  return {
    score: Math.min(100, score),
    grade: grade(score),
    reasons,
    recommendedActions: [
      "Activar Leo Cobranza desde App Store o Empleados digitales",
      "Cargar clientes con teléfono",
      "Correr dry-run y aprobar un mensaje",
    ],
  }
}
