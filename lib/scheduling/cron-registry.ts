import { shouldRunInWindow } from "@/lib/ai/agents/cron-matcher"
import { syncFacturasPendientes } from "@/lib/afip/sync-pendientes"
import { runAllVirtualWorkers } from "@/lib/automation/virtual-worker-runner"
import type { SchedulerTier } from "./scheduler-config"
import { getSchedulerWindowMinutes } from "./scheduler-config"
import { runScheduledAgents } from "./jobs/agentes"
import { runOpsAlertas } from "./jobs/ops-alertas"
import { runRecordatoriosTurnos } from "./jobs/recordatorios"
import { runWhatsAppOutbound } from "./jobs/whatsapp-outbound"

export type CronJobGranularity = "tick" | "hour" | "day"

export type CronJobDefinition = {
  id: string
  label: string
  tier: SchedulerTier
  /** Si true, corre en cada tick del dispatcher (cada 5 min en tier free). */
  everyTick?: boolean
  /** Expresión cron estándar (UTC). Ignorada si everyTick=true. */
  schedule?: string
  windowMinutes?: number
  dedup?: CronJobGranularity
  run: () => Promise<unknown>
}

export const CRON_JOBS: CronJobDefinition[] = [
  {
    id: "virtual-workers",
    label: "Empleados virtuales / playbooks",
    tier: "free",
    everyTick: true,
    run: runAllVirtualWorkers,
  },
  {
    id: "sync-afip",
    label: "Sincronización CAE pendiente",
    tier: "free",
    everyTick: true,
    run: syncFacturasPendientes,
  },
  {
    id: "whatsapp-outbound",
    label: "Cola WhatsApp aprobada",
    tier: "free",
    everyTick: true,
    run: runWhatsAppOutbound,
  },
  {
    id: "ops-alertas",
    label: "Alertas operaciones Claver Cloud",
    tier: "free",
    everyTick: true,
    run: runOpsAlertas,
  },
  {
    id: "agentes",
    label: "Agentes IA programados",
    tier: "free",
    schedule: "0 * * * *",
    windowMinutes: 60,
    dedup: "hour",
    run: runScheduledAgents,
  },
  {
    id: "recordatorios",
    label: "Recordatorios de turnos",
    tier: "free",
    schedule: "0 18 * * *",
    dedup: "day",
    run: runRecordatoriosTurnos,
  },
  {
    id: "event-replay",
    label: "Reintento handlers fallidos (dead-letter)",
    tier: "free",
    schedule: "0 */6 * * *",
    windowMinutes: 60,
    dedup: "hour",
    run: async () => {
      const { replayFailedHandlerLogs } = await import("@/lib/events/dead-letter-replay")
      return replayFailedHandlerLogs()
    },
  },
  {
    id: "renovacion-abonos",
    label: "Avisos trial / MP pendiente",
    tier: "free",
    schedule: "0 9 * * *",
    dedup: "day",
    run: async () => {
      const { runRenovacionAbonos } = await import("@/lib/scheduling/jobs/renovacion-abonos")
      return runRenovacionAbonos()
    },
  },
  {
    id: "ia-diaria",
    label: "IA diaria (alertas + reportes)",
    tier: "premium",
    schedule: "0 9 * * *",
    dedup: "day",
    run: async () => {
      const { runIaDiaria } = await import("./jobs/ia-diaria")
      return runIaDiaria()
    },
  },
  {
    id: "cobranzas-ia",
    // free: Claver Cobrá (intang.cobranzas_wa) debe poder operar sin tier premium
    label: "Cobranzas IA / secretaria WA",
    tier: "free",
    schedule: "0 10 * * 1-5",
    dedup: "day",
    run: async () => {
      const { runCobranzasIA } = await import("./jobs/cobranzas-ia")
      return runCobranzasIA()
    },
  },
  {
    id: "consorcios-morosos",
    label: "Consorcios — aviso WA morosos expensas",
    tier: "free",
    schedule: "0 11 * * 1",
    windowMinutes: 120,
    dedup: "day",
    run: async () => {
      const { runMorosoExpensaAlertas } = await import("./jobs/consorcios-alertas")
      return runMorosoExpensaAlertas()
    },
  },
  {
    id: "consorcios-liquidacion",
    label: "Consorcios — liquidación pendiente (día 1–5)",
    tier: "free",
    schedule: "0 12 * * *",
    dedup: "day",
    run: async () => {
      const { runLiquidacionPendienteAlertas } = await import("./jobs/consorcios-alertas")
      return runLiquidacionPendienteAlertas()
    },
  },
  {
    id: "facturacion-recurrente",
    label: "Facturación recurrente multi-tenant (Factura + CxC)",
    tier: "free",
    schedule: "0 7 * * *",
    windowMinutes: 120,
    dedup: "day",
    run: async () => {
      const { runFacturacionRecurrenteAllTenants } = await import("./jobs/facturacion-recurrente")
      return runFacturacionRecurrenteAllTenants()
    },
  },
  {
    id: "inmobiliaria-alquileres",
    label: "Inmobiliaria — facturación mensual alquileres (CxC)",
    tier: "free",
    schedule: "0 8 1 * *",
    windowMinutes: 120,
    dedup: "day",
    run: async () => {
      const { runFacturacionAlquileresMensual } = await import("./jobs/inmobiliaria-alertas")
      return runFacturacionAlquileresMensual()
    },
  },
  {
    id: "inmobiliaria-contrato-vence",
    label: "Inmobiliaria — contratos que vencen en 30 días",
    tier: "free",
    schedule: "0 9 * * *",
    dedup: "day",
    run: async () => {
      const { runContratoVence30 } = await import("./jobs/inmobiliaria-alertas")
      return runContratoVence30()
    },
  },
  {
    id: "inmobiliaria-alquiler-impago",
    label: "Inmobiliaria — aviso WA alquiler impago",
    tier: "free",
    schedule: "0 10 * * 3",
    windowMinutes: 120,
    dedup: "day",
    run: async () => {
      const { runAlquilerImpago } = await import("./jobs/inmobiliaria-alertas")
      return runAlquilerImpago()
    },
  },
]

export function isJobDue(job: CronJobDefinition, now = new Date()): boolean {
  if (job.everyTick) return true
  if (!job.schedule) return false
  const window = job.windowMinutes ?? getSchedulerWindowMinutes()
  return shouldRunInWindow(job.schedule, window, now)
}

export function getJobsForTier(tier: SchedulerTier): CronJobDefinition[] {
  if (tier === "premium") return CRON_JOBS
  return CRON_JOBS.filter((job) => job.tier === "free")
}