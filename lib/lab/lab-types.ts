export type LabLeadEstado =
  | "frio"
  | "contactado"
  | "demo_agendada"
  | "trial_activo"
  | "cliente"
  | "perdido"

export interface LabLeadItem {
  id: string
  nombre: string
  direccion: string
  zona: string
  rubro: string
  estado: LabLeadEstado
  productoTarget: string
  mrrEstimado: number
  ultimoContacto?: string
  telefono?: string
  score?: number
  scoreReasons?: string[]
  waEnviados?: number
  notas?: string
  pitchVariant?: "A" | "B"
  createdAt?: string
}

export interface LabMissionItem {
  id: string
  titulo: string
  categoria: "Ventas" | "Producto" | "Marketing" | "Finanzas" | "Networking"
  prioridad: "alta" | "media" | "baja"
  completada: boolean
  impacto: string
  auto?: boolean
}

export interface LabRegulationItem {
  id: string
  normativa: string
  jurisdiccion: "Nacional" | "Provincial" | "Municipal"
  queExige: string
  argumentoVenta: string
  urgencia: "alta" | "media" | "normal"
  argumentoVentaB?: string
}

export interface LabMilestoneItem {
  id: string
  fase: string
  titulo: string
  descripcion: string
  completado: boolean
  hitoSalida: string
}

export interface LabEventItem {
  id: string
  tipo: string
  mensaje: string
  meta?: Record<string, unknown>
  createdAt: string
}

export interface LabWaLogItem {
  id: string
  leadId: string
  leadNombre: string
  variant: "A" | "B" | "custom"
  preview: string
  createdAt: string
}

export interface LabProductSignals {
  deudoresFiado: number
  deudaTotalAbs: number
  suscripcionesActivas: number
  skusActivos: string[]
  leoActivo: boolean
  empleadosDigitales: number
  trialExpiraEnDias: number | null
  empresaNombre: string | null
}

export interface LabNextAction {
  title: string
  detail: string
  leadId: string | null
  kind: "trial" | "demo" | "mission" | "frio" | "empty" | "product"
  priority: number
}

export interface LabAbStats {
  [key: string]: { copies: number; waClicks: number }
}

export interface LabPitchPack {
  id: string
  titulo: string
  contexto: string
  variantA: string
  variantB: string
  stats: { copiesA: number; copiesB: number; waA: number; waB: number }
}

export interface LabDashboardPayload {
  ok: true
  metricas: {
    mrrActual: number
    pipelinePotencial: number
    leadsTotal: number
    demosActivas: number
    metaMes: number
    progresoMeta: number
    burnRate: number
    runwayMeses: string
    scorePromedio: number
    clientes: number
    frios: number
  }
  leads: LabLeadItem[]
  misiones: LabMissionItem[]
  regulaciones: LabRegulationItem[]
  hitoss: LabMilestoneItem[]
  nextAction: LabNextAction
  productSignals: LabProductSignals
  eventos: LabEventItem[]
  waLogs: LabWaLogItem[]
  abStats: LabAbStats
  funnel: { estado: string; label: string; count: number; mrr: number }[]
  pitchPacks: LabPitchPack[]
}
