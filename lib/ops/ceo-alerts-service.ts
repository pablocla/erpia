import { CEO_METAS_F1 } from "@/lib/ops/ceo-roadmap-catalog"
import type { CeoTareaEnriquecida } from "@/lib/ops/ceo-task-service"

export type CeoAlertSeveridad = "critica" | "advertencia" | "info" | "exito"

export type CeoAlert = {
  id: string
  severidad: CeoAlertSeveridad
  titulo: string
  mensaje: string
  accion?: string
  href?: string
}

type AlertInput = {
  clientesPagos: number
  pipelineActivos: number
  leadsEnTrial: number
  leadsVisitaSemana: number
  followupsVencidos: number
  entornosEnError: number
  setupCompleto: boolean
  tareasCriticasPendientes: CeoTareaEnriquecida[]
  faseActual: string
  mrrTotalArs: number
}

export function generarCeoAlerts(input: AlertInput): CeoAlert[] {
  const alerts: CeoAlert[] = []

  if (!input.setupCompleto) {
    alerts.push({
      id: "setup-incompleto",
      severidad: "critica",
      titulo: "Setup incompleto",
      mensaje: "No salgas a vender masivo hasta tener monotributo, cobros y demo listos.",
      accion: "Completá Fase 0 en el roadmap",
    })
  }

  if (input.clientesPagos === 0) {
    alerts.push({
      id: "sin-cliente-pago",
      severidad: "critica",
      titulo: "Cero clientes pagos",
      mensaje: "Tu única prioridad: 1 cliente pagando enganche. Ignorá redes y ads por ahora.",
      accion: "Salí a 4 visitas hoy",
      href: "/dashboard/documentacion/comercial/roadmap-venta-vendedor",
    })
  }

  if (input.pipelineActivos === 0 && input.faseActual !== "f0") {
    alerts.push({
      id: "pipeline-vacio",
      severidad: "advertencia",
      titulo: "Pipeline vacío",
      mensaje: "Sin prospectos cargados perdés follow-ups. Anotá cada visita aunque no cierren.",
      accion: "Nuevo prospecto",
    })
  }

  if (input.followupsVencidos > 0) {
    alerts.push({
      id: "followup-vencido",
      severidad: "advertencia",
      titulo: `${input.followupsVencidos} follow-up(s) vencido(s)`,
      mensaje: "Contactá hoy por WhatsApp antes de buscar leads nuevos.",
    })
  }

  if (input.leadsVisitaSemana < 5 && input.faseActual === "f1" && input.clientesPagos < 3) {
    alerts.push({
      id: "pocas-visitas",
      severidad: "advertencia",
      titulo: "Ritmo de visitas bajo",
      mensaje: `Meta semana: ${CEO_METAS_F1.visitasSemana} visitas. Llevás ${input.leadsVisitaSemana} registradas esta semana.`,
      accion: "Agendá bloque mañana/tarde de calle",
    })
  }

  if (input.leadsEnTrial > 0 && input.clientesPagos === 0) {
    alerts.push({
      id: "trials-sin-cierre",
      severidad: "info",
      titulo: `${input.leadsEnTrial} trial(s) activo(s)`,
      mensaje: "Día 12 del trial: mensaje de conversión con precio y link de pago.",
    })
  }

  if (input.entornosEnError > 0) {
    alerts.push({
      id: "entornos-error",
      severidad: "critica",
      titulo: `${input.entornosEnError} entorno(s) con error`,
      mensaje: "Un cliente con caída te quita tiempo de venta. Resolvelo antes de ampliar zona.",
      href: "/claver-cloud/superadmin",
    })
  }

  if (input.clientesPagos >= 1 && input.clientesPagos < 3) {
    alerts.push({
      id: "primer-cliente-ok",
      severidad: "exito",
      titulo: "¡Primer cliente! Repetí el playbook",
      mensaje: `${input.clientesPagos} cliente(s) pago(s). Objetivo Fase 1: ${CEO_METAS_F1.conversiones} antes de marketing.`,
    })
  }

  if (input.clientesPagos === 0 && input.mrrTotalArs > 0) {
    alerts.push({
      id: "mrr-solo-demo",
      severidad: "info",
      titulo: "MRR de demos, no de calle",
      mensaje: "El MRR que ves puede ser de tenants demo. Tu métrica real es clientes pagos en pipeline cerrado.",
    })
  }

  if (input.clientesPagos < 3) {
    alerts.push({
      id: "no-marketing",
      severidad: "info",
      titulo: "No hagas campañas publicitarias todavía",
      mensaje: "Instagram, Meta Ads y SEO esperan a tener 3 clientes pagos y testimonio local. Venta boca a boca primero.",
    })
  }

  for (const t of input.tareasCriticasPendientes.slice(0, 2)) {
    alerts.push({
      id: `tarea-${t.codigo}`,
      severidad: "advertencia",
      titulo: `Pendiente: ${t.titulo}`,
      mensaje: t.descripcion,
      href: t.href,
    })
  }

  const orden: Record<CeoAlertSeveridad, number> = {
    critica: 0,
    advertencia: 1,
    info: 2,
    exito: 3,
  }

  return alerts.sort((a, b) => (orden[a.severidad] ?? 9) - (orden[b.severidad] ?? 9))
}

// Fix type - I used "alta" as severidad but type doesn't include it. Let me fix - use advertencia for task alerts instead.