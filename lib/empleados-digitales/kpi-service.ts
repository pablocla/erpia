/**
 * KPIs Leo — radar de deuda, envíos, recovery estimado (ED-08 / ED-13)
 */

import { prisma } from "@/lib/prisma"
import { DEFAULT_LEO_CONFIG, type EmpleadoLeoCobranzaConfig } from "./types"
import { leerDeudas } from "./tools/leer-deudas"
import { countUsageMes, periodMonth } from "./metering"

function parseConfig(raw: unknown): EmpleadoLeoCobranzaConfig {
  const c = (raw && typeof raw === "object" ? raw : {}) as Partial<EmpleadoLeoCobranzaConfig>
  return {
    ...DEFAULT_LEO_CONFIG,
    ...c,
    llmSoloSi: { ...DEFAULT_LEO_CONFIG.llmSoloSi, ...c.llmSoloSi },
    horarioLocal: { ...DEFAULT_LEO_CONFIG.horarioLocal, ...c.horarioLocal },
    limites: { ...DEFAULT_LEO_CONFIG.limites, ...c.limites },
    excluirClienteIds: c.excluirClienteIds ?? DEFAULT_LEO_CONFIG.excluirClienteIds,
    fuentes: c.fuentes ?? DEFAULT_LEO_CONFIG.fuentes,
  }
}

export type LeoKpis = {
  deudaEnRadarArs: number
  deudoresEnRadar: number
  sinTelefono: number
  draftsPendientes: number
  enviadosMes: number
  draftsMes: number
  llmMes: number
  tokensMes: number
  /** Estimado: pagos CxC/fiado en ventana post-aprobación WA */
  arsRecuperadosMes: number
  recuperacionesCount: number
  periodMonth: string
  limites: EmpleadoLeoCobranzaConfig["limites"]
  trial: boolean
  llmLocked: boolean
}

/**
 * Recovery v0: sumar saldos pagados en CxC actualizadas en 7d tras approve WA
 * del mismo cliente, o reducción de deuda fiado (heurística simple).
 */
export async function estimateRecoveryMes(
  empresaId: number,
  empleadoId: number,
): Promise<{ ars: number; count: number }> {
  const month = periodMonth()
  const [y, m] = month.split("-").map(Number)
  const desde = new Date(y, m - 1, 1)
  const hasta = new Date(y, m, 0, 23, 59, 59, 999)

  const aprobadas = await prisma.empleadoDigitalTarea.findMany({
    where: {
      empresaId,
      empleadoDigitalId: empleadoId,
      estado: { in: ["aprobada", "enviada"] },
      aprobadoAt: { gte: desde, lte: hasta },
      clienteId: { not: null },
    },
    select: {
      clienteId: true,
      montoArs: true,
      aprobadoAt: true,
    },
    take: 200,
  })

  let ars = 0
  let count = 0
  const seen = new Set<string>()

  for (const t of aprobadas) {
    if (!t.clienteId || !t.aprobadoAt) continue
    const key = `${t.clienteId}-${t.aprobadoAt.toISOString().slice(0, 10)}`
    if (seen.has(key)) continue
    seen.add(key)

    const ventanaFin = new Date(t.aprobadoAt.getTime() + 7 * 86_400_000)
    const montoDraft = Number(t.montoArs ?? 0)

    // CxC con pago parcial/total en ventana
    const cxcPagadas = await prisma.cuentaCobrar.findMany({
      where: {
        clienteId: t.clienteId,
        updatedAt: { gte: t.aprobadoAt, lte: ventanaFin },
        OR: [
          { estado: "pagada" },
          { montoPagado: { gt: 0 } },
        ],
      },
      select: { montoPagado: true, montoOriginal: true, saldo: true, estado: true },
      take: 10,
    })

    let recuperado = 0
    for (const c of cxcPagadas) {
      const pagado = Number(c.montoPagado ?? 0)
      if (pagado > 0) recuperado += pagado
      else if (c.estado === "pagada") {
        recuperado += Number(c.montoOriginal ?? 0)
      }
    }

    // Fiado: si el cliente bajó deuda (saldo más cerca de 0)
    if (recuperado <= 0) {
      const cl = await prisma.cliente.findFirst({
        where: { id: t.clienteId, empresaId },
        select: { saldoCuentaCorriente: true, updatedAt: true },
      })
      if (
        cl &&
        cl.updatedAt >= t.aprobadoAt &&
        cl.updatedAt <= ventanaFin &&
        Number(cl.saldoCuentaCorriente) >= -0.01
      ) {
        // Cuenta en cero o a favor → atribuir monto del draft (estimado)
        recuperado = montoDraft
      }
    }

    if (recuperado > 0) {
      ars += Math.min(recuperado, montoDraft > 0 ? montoDraft * 1.5 : recuperado)
      count++
    }
  }

  return { ars: Math.round(ars * 100) / 100, count }
}

export async function getLeoKpis(input: {
  empresaId: number
  empleadoId: number
  estado: string
  config: unknown
  tokensMes: number
}): Promise<LeoKpis> {
  const config = parseConfig(input.config)
  const trial = input.estado === "trial"
  const limites = trial
    ? {
        maxDraftsMes: Math.min(config.limites.maxDraftsMes, 30),
        maxLlmMes: 0,
        maxWaSendMes: Math.min(config.limites.maxWaSendMes, 20),
      }
    : config.limites

  const ctx = {
    empresaId: input.empresaId,
    empleadoId: input.empleadoId,
    runId: BigInt(0),
  }

  const [deudas, draftsPendientes, draftsMes, llmMes, enviadosMes, recovery] =
    await Promise.all([
      leerDeudas(ctx, config).catch(() => []),
      prisma.empleadoDigitalTarea.count({
        where: {
          empresaId: input.empresaId,
          empleadoDigitalId: input.empleadoId,
          estado: "pendiente",
        },
      }),
      countUsageMes(input.empresaId, input.empleadoId, "wa_draft"),
      countUsageMes(input.empresaId, input.empleadoId, "llm_call"),
      countUsageMes(input.empresaId, input.empleadoId, "wa_send"),
      estimateRecoveryMes(input.empresaId, input.empleadoId),
    ])

  const deudaEnRadarArs = deudas.reduce((s, d) => s + d.montoArs, 0)
  const sinTelefono = deudas.filter((d) => !d.telefono?.trim()).length

  // Persist valor estimado en instancia (best-effort)
  if (recovery.ars > 0) {
    void prisma.empleadoDigital
      .update({
        where: { id: input.empleadoId },
        data: { valorEstimadoArs: recovery.ars },
      })
      .catch(() => {})
  }

  return {
    deudaEnRadarArs: Math.round(deudaEnRadarArs * 100) / 100,
    deudoresEnRadar: deudas.length,
    sinTelefono,
    draftsPendientes,
    enviadosMes,
    draftsMes,
    llmMes,
    tokensMes: input.tokensMes,
    arsRecuperadosMes: recovery.ars,
    recuperacionesCount: recovery.count,
    periodMonth: periodMonth(),
    limites,
    trial,
    llmLocked: trial || limites.maxLlmMes === 0,
  }
}
