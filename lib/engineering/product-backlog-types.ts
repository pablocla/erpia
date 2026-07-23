/**
 * Product Engineering Backlog — tipos.
 * Fuente: repo (Grok + Gemini leen archivos, no Postgres).
 */

export type BacklogPriority = "P0" | "P1" | "P2" | "P3"
export type BacklogStatus = "todo" | "doing" | "blocked" | "done" | "cancelled"

/** Quién ejecuta el ticket */
export type BacklogAssignee =
  | "grok" // Grok Build — código, multi-archivo, tests, APIs, runtime
  | "gemini" // Gemini — docs, copy, auditoría, QA matriz, playbooks, prompts
  | "pair" // Gemini especifica / Grok implementa (o viceversa en review)
  | "human" // Decisión comercial, legal, precio, ventas humanas

/** Etapa del ciclo de vida del software / negocio */
export type BacklogLifecycle =
  | "foundation" // cimientos técnicos
  | "build" // desarrollo de producto
  | "comercial" // venta, pricing, packaging, pipeline
  | "onboarding" // trial, activación, primer valor
  | "implementacion" // Claver Cloud, CCA, parametrización
  | "go_live" // checklist producción
  | "postventa" // soporte, success, retención, expansión
  | "growth" // marketing, viralidad, partners
  | "scale" // infra escala, RPA, diferidos

export type BacklogWave = "W0" | "W1" | "W2" | "W3" | "W4"

export type BacklogEpic =
  | "leo"
  | "agentic"
  | "pos"
  | "fiscal"
  | "marketplace"
  | "security"
  | "infra"
  | "ux"
  | "growth"
  | "tokens"
  | "comercial"
  | "implementacion"
  | "postventa"
  | "other"

export type BacklogTicket = {
  id: string
  title: string
  description: string
  epic: BacklogEpic
  priority: BacklogPriority
  wave: BacklogWave
  /** Asignado principal (criterio en ASSIGNMENT.md) */
  assignee: BacklogAssignee
  /** Etapa del ciclo de vida */
  lifecycle: BacklogLifecycle
  estimate: string
  paths: string[]
  dod: string
  promptRef?: string
  blockedBy?: string[]
  relatedTo?: string[]
  valueNote?: string
  defaultStatus?: BacklogStatus
  tags?: string[]
  /**
   * Prompt corto listo para pegar en Gemini o Grok
   * (si falta, se genera genérico en UI)
   */
  agentPrompt?: string
}

export type BacklogStatusEntry = {
  status: BacklogStatus
  updatedAt: string
  updatedBy?: string
  note?: string
}

export type BacklogStatusFile = {
  version: 1
  statuses: Record<string, BacklogStatusEntry>
  updatedAt: string
}

export type BacklogTicketView = BacklogTicket & {
  status: BacklogStatus
  statusNote?: string
  statusUpdatedAt?: string
  statusUpdatedBy?: string
  cascadeBlocked: boolean
  cascadeBlockedBy: string[]
  cascadeDepth: number
  onCriticalPath: boolean
  prereqProgress: number
}

export type BacklogWaveMeta = {
  id: BacklogWave
  name: string
  goal: string
  horizon: string
  color: string
}

export const BACKLOG_WAVES: BacklogWaveMeta[] = [
  {
    id: "W0",
    name: "W0 · Cimientos",
    goal: "Infra ya entregada o base sobre la que se apoya todo",
    horizon: "Hecho / baseline",
    color: "slate",
  },
  {
    id: "W1",
    name: "W1 · Primeros pesos",
    goal: "Time-to-first-recovered-pesos: Leo ve deudas, link MP, 1 envío",
    horizon: "7–10 días",
    color: "emerald",
  },
  {
    id: "W2",
    name: "W2 · Leo vendible",
    goal: "KPI $, onboarding, trial, marketplace limpio, recovery medible",
    horizon: "2–4 semanas",
    color: "sky",
  },
  {
    id: "W3",
    name: "W3 · Plataforma + ciclo de vida",
    goal: "Multi-empleado, comercial→postventa, shell lite, billing",
    horizon: "1–2 meses",
    color: "violet",
  },
  {
    id: "W4",
    name: "W4 · Escala & diferidos",
    goal: "Capa 3 RPA, cache LLM, optimizaciones pesadas",
    horizon: "Post-PMF",
    color: "amber",
  },
]

export const ASSIGNEE_META: Record<
  BacklogAssignee,
  { label: string; short: string; color: string; does: string }
> = {
  grok: {
    label: "Grok Build",
    short: "GROK",
    color: "emerald",
    does: "Código, APIs, Prisma, tests, runtime, multi-archivo en monorepo",
  },
  gemini: {
    label: "Gemini",
    short: "GEM",
    color: "violet",
    does: "Docs, copy es-AR, auditorías, matrices QA, playbooks, prompts, revisión",
  },
  pair: {
    label: "Pair (Gem→Grok)",
    short: "PAIR",
    color: "sky",
    does: "Gemini escribe spec/DoD; Grok implementa; review cruzado",
  },
  human: {
    label: "Humano",
    short: "YOU",
    color: "amber",
    does: "Precio, legal, ventas, firmas, decisiones de negocio",
  },
}

export const LIFECYCLE_META: Record<
  BacklogLifecycle,
  { label: string; order: number }
> = {
  foundation: { label: "Cimientos", order: 0 },
  build: { label: "Build producto", order: 1 },
  comercial: { label: "Comercial", order: 2 },
  onboarding: { label: "Onboarding / Trial", order: 3 },
  implementacion: { label: "Implementación Cloud", order: 4 },
  go_live: { label: "Go-live", order: 5 },
  postventa: { label: "Postventa / Success", order: 6 },
  growth: { label: "Growth", order: 7 },
  scale: { label: "Escala", order: 8 },
}
