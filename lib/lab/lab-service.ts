/**
 * Claver Lab — command center del fundador.
 * Persistencia local por empresa (sin cron, sin SaaS de pago extra).
 * Señales de producto en vivo vía Prisma en cada GET.
 */

import { promises as fs } from "fs"
import path from "path"
import { prisma } from "@/lib/prisma"
import { buildWaMessage } from "@/lib/lab/lab-messages"
import type {
  LabLeadItem,
  LabMissionItem,
  LabRegulationItem,
  LabMilestoneItem,
  LabEventItem,
  LabWaLogItem,
  LabProductSignals,
  LabNextAction,
  LabAbStats,
  LabPitchPack,
  LabDashboardPayload,
  LabLeadEstado,
} from "@/lib/lab/lab-types"

export type {
  LabLeadItem,
  LabMissionItem,
  LabRegulationItem,
  LabMilestoneItem,
  LabEventItem,
  LabWaLogItem,
  LabProductSignals,
  LabNextAction,
  LabAbStats,
  LabPitchPack,
  LabDashboardPayload,
  LabLeadEstado,
}

export interface LabPersistedState {
  version: 1
  leads: LabLeadItem[]
  misiones: LabMissionItem[]
  eventos: LabEventItem[]
  waLogs: LabWaLogItem[]
  abStats: LabAbStats
  seededAt: string
}

// ─── Seed data ───────────────────────────────────────────────────────────────

export const INITIAL_LAB_LEADS: LabLeadItem[] = [
  {
    id: "lead-1",
    nombre: "Autoservicio Don Pedro",
    direccion: "Mendoza 3420, Rosario",
    zona: "Echesortu",
    rubro: "Almacén",
    estado: "demo_agendada",
    productoTarget: "Fiado + Leo Cobranza",
    mrrEstimado: 19900,
    ultimoContacto: "2026-07-22",
    telefono: "3415551234",
  },
  {
    id: "lead-2",
    nombre: "La Cervecería del Bulevar",
    direccion: "Av. Pellegrini 1450, Rosario",
    zona: "Pellegrini",
    rubro: "Gastronomía",
    estado: "trial_activo",
    productoTarget: "POS + Comandas + KDS",
    mrrEstimado: 25000,
    ultimoContacto: "2026-07-21",
    telefono: "3415555678",
  },
  {
    id: "lead-3",
    nombre: "Kiosco 24hs San Martín",
    direccion: "San Martín 920, Rosario",
    zona: "Peatonal Córdoba",
    rubro: "Kiosco",
    estado: "contactado",
    productoTarget: "Fiado Digital",
    mrrEstimado: 14900,
    ultimoContacto: "2026-07-20",
    telefono: "3415559012",
  },
  {
    id: "lead-4",
    nombre: "Consultorio Estético Fisherton",
    direccion: "Córdoba 7800, Rosario",
    zona: "Fisherton",
    rubro: "Servicios",
    estado: "frio",
    productoTarget: "Turnos + Sofía Confirmá",
    mrrEstimado: 19900,
    ultimoContacto: "2026-07-18",
    telefono: "3415553456",
  },
  {
    id: "lead-5",
    nombre: "Boutique Italia",
    direccion: "Córdoba 1240, Rosario",
    zona: "Peatonal Córdoba",
    rubro: "Indumentaria",
    estado: "frio",
    productoTarget: "Stock + Facturación AFIP",
    mrrEstimado: 25000,
    ultimoContacto: "2026-07-15",
    telefono: "3415557890",
  },
  {
    id: "lead-6",
    nombre: "Ferretería El Candado",
    direccion: "Av. Alberdi 650, Rosario",
    zona: "Arroyito",
    rubro: "Autoservicio",
    estado: "contactado",
    productoTarget: "Pack Almacén + Balanza",
    mrrEstimado: 25000,
    ultimoContacto: "2026-07-19",
    telefono: "3415552345",
  },
]

export const INITIAL_LAB_MISSIONS: LabMissionItem[] = [
  {
    id: "m-1",
    titulo: "Enviar 3 mensajes de WhatsApp a prospectos de Echesortu",
    categoria: "Ventas",
    prioridad: "alta",
    completada: false,
    impacto: "Alta probabilidad de agendar 1 demo hoy",
  },
  {
    id: "m-2",
    titulo: "Revisar prueba de Leo Cobranza en Autoservicio Don Pedro",
    categoria: "Producto",
    prioridad: "alta",
    completada: true,
    impacto: "Asegura la conversión de trial a cliente pago",
  },
  {
    id: "m-3",
    titulo: "Publicar 1 video corto mostrando el cobro express en 3s",
    categoria: "Marketing",
    prioridad: "media",
    completada: false,
    impacto: "Inbound de comercios de barrio en Instagram",
  },
  {
    id: "m-4",
    titulo: "Contactar a 1 contador local para presentar el Portal Contador",
    categoria: "Networking",
    prioridad: "media",
    completada: false,
    impacto: "Canal de referidos recurrente sin costo",
  },
]

export const LAB_REGULATIONS: LabRegulationItem[] = [
  {
    id: "reg-1",
    normativa: "RG 4291 AFIP — Factura Electrónica Obligatoria",
    jurisdiccion: "Nacional",
    queExige:
      "Emisión obligatoria de comprobantes electrónicos para Monotributistas y Responsables Inscriptos.",
    argumentoVenta:
      "Con Claver emitís comprobantes sin entrar a la web de AFIP y sin que se te caiga el sistema.",
    argumentoVentaB:
      "¿Perdés 10 minutos por factura en la web de AFIP? En el mostrador la sacás en un toque y seguís cobrando.",
    urgencia: "alta",
  },
  {
    id: "reg-2",
    normativa: "RG 5616 AFIP — Libro IVA Digital Directo",
    jurisdiccion: "Nacional",
    queExige: "Presentación mensual del detalle digital de compras y ventas.",
    argumentoVenta:
      "Tu contador descarga el archivo Libro IVA Digital desde Claver en 1 clic sin pedirte papeles.",
    argumentoVentaB:
      "Dejá de mandar Excel al contador a las 23:50 del vencimiento. El export sale solo desde Claver.",
    urgencia: "alta",
  },
  {
    id: "reg-3",
    normativa: "Ordenanza 9794 Rosario — Exhibición de Precios Claras",
    jurisdiccion: "Municipal",
    queExige: "Obligatoriedad de exhibir precios actualizados y visibles al público.",
    argumentoVenta:
      "Actualizá 5.000 precios por IPC en 2 segundos con la reexpresión automática de Claver.",
    argumentoVentaB:
      "Con la inflación, remarcar a mano es regalar margen. Claver reexpresa la lista entera en un click.",
    urgencia: "media",
  },
  {
    id: "reg-4",
    normativa: "Res. Gral. 15/2024 API Santa Fe — Régimen IIBB",
    jurisdiccion: "Provincial",
    queExige: "Percepción y retención digitalizada de Ingresos Brutos Santa Fe.",
    argumentoVenta:
      "Claver calcula las alícuotas de IIBB Santa Fe automáticamente en cada comprobante.",
    argumentoVentaB:
      "IIBB Santa Fe sin planilla paralela: el sistema lo mete en la factura y listo.",
    urgencia: "normal",
  },
]

export const LAB_MILESTONES: LabMilestoneItem[] = [
  {
    id: "fase-0",
    fase: "Fase 0",
    titulo: "Cimientos del Sistema",
    descripcion: "Motor POS, AFIP, PWA Offline y arquitectura multi-tenant",
    completado: true,
    hitoSalida: "Compilación clean sin errores + Deploy en Vercel",
  },
  {
    id: "fase-1",
    fase: "Fase 1",
    titulo: "Producto Mínimo Vendible (PLG)",
    descripcion: "Leo Cobranza funcional + Libreta de Fiado + POS Mostrador",
    completado: false,
    hitoSalida: "1er comercio real operando con Leo en producción",
  },
  {
    id: "fase-2",
    fase: "Fase 2",
    titulo: "Primeros 5 Clientes Pagos",
    descripcion: "Ventas directas en Rosario (Echesortu, Pellegrini, Peatonal)",
    completado: false,
    hitoSalida: "5 suscripciones activas ($100.000 ARS/mes MRR)",
  },
  {
    id: "fase-3",
    fase: "Fase 3",
    titulo: "Product-Market Fit & Red de Contadores",
    descripcion: "Canal de contadores + retención >80% al mes 3",
    completado: false,
    hitoSalida: "20 clientes activos + churn <10%",
  },
  {
    id: "fase-4",
    fase: "Fase 4",
    titulo: "Escala Regional Santa Fe",
    descripcion: "Expansión a Gran Rosario, San Lorenzo y Santa Fe Capital",
    completado: false,
    hitoSalida: "50 clientes activos ($1M ARS/mes MRR)",
  },
]

const ZONAS_PRIORITY = new Set(["Echesortu", "Pellegrini", "Peatonal Córdoba"])
const PRODUCTOS_PRD = ["Fiado + Leo Cobranza", "Fiado Digital", "Pack Almacén"]

const DATA_DIR = path.join(process.cwd(), "data", "claver-lab")

// ─── Persistence (filesystem — $0, no cron) ──────────────────────────────────

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

function statePath(empresaId: number) {
  return path.join(DATA_DIR, `empresa-${empresaId}.json`)
}

function emptyState(): LabPersistedState {
  return {
    version: 1,
    leads: [],
    misiones: [],
    eventos: [],
    waLogs: [],
    abStats: {},
    seededAt: new Date().toISOString(),
  }
}

export async function loadLabState(empresaId: number): Promise<LabPersistedState> {
  await ensureDataDir()
  const file = statePath(empresaId)
  try {
    const raw = await fs.readFile(file, "utf-8")
    const parsed = JSON.parse(raw) as LabPersistedState
    if (!parsed.leads || !parsed.misiones) return seedState(empresaId)
    return {
      version: 1,
      leads: parsed.leads ?? [],
      misiones: parsed.misiones ?? [],
      eventos: parsed.eventos ?? [],
      waLogs: parsed.waLogs ?? [],
      abStats: parsed.abStats ?? {},
      seededAt: parsed.seededAt ?? new Date().toISOString(),
    }
  } catch {
    return seedState(empresaId)
  }
}

async function saveLabState(empresaId: number, state: LabPersistedState) {
  await ensureDataDir()
  // cap logs
  state.eventos = (state.eventos ?? []).slice(0, 80)
  state.waLogs = (state.waLogs ?? []).slice(0, 50)
  await fs.writeFile(statePath(empresaId), JSON.stringify(state, null, 2), "utf-8")
}

async function seedState(empresaId: number): Promise<LabPersistedState> {
  const state: LabPersistedState = {
    version: 1,
    leads: INITIAL_LAB_LEADS.map((l) => ({
      ...l,
      waEnviados: 0,
      createdAt: new Date().toISOString(),
    })),
    misiones: INITIAL_LAB_MISSIONS.map((m) => ({ ...m })),
    eventos: [
      {
        id: `ev-seed-${Date.now()}`,
        tipo: "seed",
        mensaje: "Lab inicializado con prospectos demo de Rosario",
        createdAt: new Date().toISOString(),
      },
    ],
    waLogs: [],
    abStats: {},
    seededAt: new Date().toISOString(),
  }
  await saveLabState(empresaId, state)
  return state
}

function pushEvent(
  state: LabPersistedState,
  tipo: string,
  mensaje: string,
  meta?: Record<string, unknown>,
) {
  state.eventos = [
    {
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tipo,
      mensaje,
      meta,
      createdAt: new Date().toISOString(),
    },
    ...(state.eventos ?? []),
  ].slice(0, 80)
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

export function scoreLead(lead: LabLeadItem): { score: number; reasons: string[] } {
  let score = 10
  const reasons: string[] = []

  if (lead.estado === "trial_activo") {
    score += 35
    reasons.push("En trial — cerrar esta semana")
  } else if (lead.estado === "demo_agendada") {
    score += 28
    reasons.push("Demo agendada")
  } else if (lead.estado === "contactado") {
    score += 14
    reasons.push("Ya hubo contacto")
  } else if (lead.estado === "frio") {
    score += 5
    reasons.push("Frío — primer contacto")
  } else if (lead.estado === "cliente") {
    score += 8
    reasons.push("Cliente (upsell / health)")
  } else if (lead.estado === "perdido") {
    score -= 20
    reasons.push("Marcado perdido")
  }

  if (lead.telefono) {
    score += 12
    reasons.push("Tiene WhatsApp")
  } else {
    reasons.push("Sin teléfono")
  }

  if (ZONAS_PRIORITY.has(lead.zona)) {
    score += 10
    reasons.push(`Zona prioritaria: ${lead.zona}`)
  }

  if (PRODUCTOS_PRD.some((p) => lead.productoTarget.includes("Fiado") || lead.productoTarget.includes(p))) {
    score += 12
    reasons.push("Pack alineado a PRD (fiado/calle)")
  }

  if (lead.mrrEstimado >= 25000) {
    score += 8
    reasons.push("MRR estimado alto")
  } else if (lead.mrrEstimado >= 19900) {
    score += 4
  }

  if (lead.ultimoContacto) {
    const days = daysSince(lead.ultimoContacto)
    if (days >= 0 && days <= 3 && lead.estado !== "frio") {
      score += 6
      reasons.push("Contacto reciente")
    }
    if (days > 14 && lead.estado === "frio") {
      score -= 5
      reasons.push("Frío hace +14 días")
    }
    if (days > 7 && (lead.estado === "contactado" || lead.estado === "demo_agendada")) {
      score += 8
      reasons.push("Sin follow-up reciente — reactivar")
    }
  }

  if ((lead.waEnviados ?? 0) === 0 && lead.telefono && lead.estado !== "cliente") {
    score += 5
    reasons.push("Nunca le escribiste por WA")
  }

  score = Math.max(0, Math.min(100, score))
  return { score, reasons: reasons.slice(0, 4) }
}

function daysSince(isoDate: string): number {
  const d = new Date(isoDate)
  if (Number.isNaN(d.getTime())) return -1
  const ms = Date.now() - d.getTime()
  return Math.floor(ms / (24 * 60 * 60 * 1000))
}

export function enrichLeadsWithScore(leads: LabLeadItem[]): LabLeadItem[] {
  return leads.map((l) => {
    const { score, reasons } = scoreLead(l)
    return { ...l, score, scoreReasons: reasons }
  })
}

// ─── Next action / funnel / metrics ──────────────────────────────────────────

export function computeNextAction(
  leads: LabLeadItem[],
  misiones: LabMissionItem[],
  signals?: LabProductSignals,
): LabNextAction {
  const scored = enrichLeadsWithScore(leads).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

  const trial = scored.find((l) => l.estado === "trial_activo")
  if (trial) {
    return {
      title: `Cerrar trial: ${trial.nombre}`,
      detail: `${trial.productoTarget} · score ${trial.score} · ${formatReasons(trial.scoreReasons)}`,
      leadId: trial.id,
      kind: "trial",
      priority: 100,
    }
  }

  const demo = scored.find((l) => l.estado === "demo_agendada")
  if (demo) {
    return {
      title: `Confirmar demo: ${demo.nombre}`,
      detail: `${demo.zona} · ${demo.mrrEstimado.toLocaleString("es-AR")} ARS/mes · score ${demo.score}`,
      leadId: demo.id,
      kind: "demo",
      priority: 90,
    }
  }

  if (signals && signals.deudoresFiado > 0 && signals.leoActivo === false) {
    return {
      title: "Activá Leo en tu propio tenant",
      detail: `Tenés ${signals.deudoresFiado} deudores en fiado y Leo no está activo — usalo de demo viva.`,
      leadId: null,
      kind: "product",
      priority: 85,
    }
  }

  const mission = misiones.find((m) => !m.completada && m.prioridad === "alta")
  if (mission) {
    return {
      title: mission.titulo,
      detail: mission.impacto,
      leadId: null,
      kind: "mission",
      priority: 70,
    }
  }

  const hot = scored.find((l) => l.estado !== "perdido" && l.estado !== "cliente" && (l.score ?? 0) >= 40)
  if (hot) {
    return {
      title: `Contactar: ${hot.nombre}`,
      detail: `Score ${hot.score} · ${formatReasons(hot.scoreReasons)}`,
      leadId: hot.id,
      kind: hot.estado === "frio" ? "frio" : "demo",
      priority: 60,
    }
  }

  return {
    title: "Sumá un prospecto de tu cuadra",
    detail: "El pipeline necesita aire fresco. Cargá un comercio con teléfono.",
    leadId: null,
    kind: "empty",
    priority: 10,
  }
}

function formatReasons(reasons?: string[]) {
  return (reasons ?? []).slice(0, 2).join(" · ") || "sin detalle"
}

export function calcularMetricasLab(leads: LabLeadItem[]) {
  const mrrActual = leads
    .filter((l) => l.estado === "cliente")
    .reduce((sum, l) => sum + l.mrrEstimado, 0)

  const pipelinePotencial = leads
    .filter((l) =>
      ["demo_agendada", "trial_activo", "contactado"].includes(l.estado),
    )
    .reduce((sum, l) => sum + l.mrrEstimado, 0)

  const leadsTotal = leads.length
  const demosActivas = leads.filter((l) =>
    ["demo_agendada", "trial_activo"].includes(l.estado),
  ).length
  const metaMes = 60000
  const progresoMeta = Math.min(100, Math.round((mrrActual / metaMes) * 100))
  const scorePromedio =
    leads.length === 0
      ? 0
      : Math.round(
          enrichLeadsWithScore(leads).reduce((s, l) => s + (l.score ?? 0), 0) / leads.length,
        )

  return {
    mrrActual,
    pipelinePotencial,
    leadsTotal,
    demosActivas,
    metaMes,
    progresoMeta,
    burnRate: 0,
    runwayMeses: "Infinito",
    scorePromedio,
    clientes: leads.filter((l) => l.estado === "cliente").length,
    frios: leads.filter((l) => l.estado === "frio").length,
  }
}

export function computeFunnel(leads: LabLeadItem[]) {
  const order = ["frio", "contactado", "demo_agendada", "trial_activo", "cliente"] as const
  const labels: Record<string, string> = {
    frio: "Frío",
    contactado: "Contactado",
    demo_agendada: "Demo",
    trial_activo: "Trial",
    cliente: "Cliente",
  }
  return order.map((estado) => ({
    estado,
    label: labels[estado],
    count: leads.filter((l) => l.estado === estado).length,
    mrr: leads.filter((l) => l.estado === estado).reduce((s, l) => s + l.mrrEstimado, 0),
  }))
}

// ─── Product signals (live, no cron) ─────────────────────────────────────────

export async function getProductSignals(empresaId: number): Promise<LabProductSignals> {
  try {
    const [empresa, deudores, suscripciones, empleados] = await Promise.all([
      prisma.empresa.findUnique({
        where: { id: empresaId },
        select: { nombre: true, trialExpiresAt: true },
      }),
      prisma.cliente.findMany({
        where: { empresaId, saldoCuentaCorriente: { lt: 0 } },
        select: { saldoCuentaCorriente: true },
        take: 500,
      }),
      prisma.suscripcionModulo.findMany({
        where: { empresaId, activo: true },
        select: { sku: true, vigenciaHasta: true },
        take: 50,
      }),
      prisma.empleadoDigital.findMany({
        where: { empresaId },
        select: { estado: true, sku: true, nombre: true },
        take: 20,
      }),
    ])

    const deudaTotalAbs = deudores.reduce(
      (s, c) => s + Math.abs(Number(c.saldoCuentaCorriente)),
      0,
    )

    const isEmpleadoOn = (estado: string) =>
      estado === "activo" || estado === "trial"

    const leoActivo = empleados.some(
      (e) =>
        isEmpleadoOn(e.estado) &&
        (e.sku?.toLowerCase().includes("leo") ||
          e.sku?.toLowerCase().includes("cobranza") ||
          e.nombre?.toLowerCase().includes("leo")),
    )

    let trialExpiraEnDias: number | null = null
    if (empresa?.trialExpiresAt) {
      trialExpiraEnDias = Math.ceil(
        (empresa.trialExpiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
      )
    }

    return {
      deudoresFiado: deudores.length,
      deudaTotalAbs: Math.round(deudaTotalAbs),
      suscripcionesActivas: suscripciones.length,
      skusActivos: suscripciones.map((s) => s.sku),
      leoActivo,
      empleadosDigitales: empleados.filter((e) => isEmpleadoOn(e.estado)).length,
      trialExpiraEnDias,
      empresaNombre: empresa?.nombre ?? null,
    }
  } catch (err) {
    console.warn("[Claver Lab] product signals fallback", err)
    return {
      deudoresFiado: 0,
      deudaTotalAbs: 0,
      suscripcionesActivas: 0,
      skusActivos: [],
      leoActivo: false,
      empleadosDigitales: 0,
      trialExpiraEnDias: null,
      empresaNombre: null,
    }
  }
}

// ─── WA drafts + A/B ─────────────────────────────────────────────────────────

export { buildWaMessage }

export function buildPitchPacks(abStats: LabAbStats): LabPitchPack[] {
  return LAB_REGULATIONS.map((reg) => ({
    id: reg.id,
    titulo: reg.normativa,
    contexto: reg.queExige,
    variantA: reg.argumentoVenta,
    variantB: reg.argumentoVentaB ?? reg.argumentoVenta,
    stats: {
      copiesA: abStats[`${reg.id}:A`]?.copies ?? 0,
      copiesB: abStats[`${reg.id}:B`]?.copies ?? 0,
      waA: abStats[`${reg.id}:A`]?.waClicks ?? 0,
      waB: abStats[`${reg.id}:B`]?.waClicks ?? 0,
    },
  }))
}

function bumpAb(state: LabPersistedState, key: string, field: "copies" | "waClicks") {
  if (!state.abStats[key]) state.abStats[key] = { copies: 0, waClicks: 0 }
  state.abStats[key][field] += 1
}

// ─── Auto missions from state (generated on read, not cron) ──────────────────

function mergeAutoMissions(
  misiones: LabMissionItem[],
  leads: LabLeadItem[],
  signals: LabProductSignals,
): LabMissionItem[] {
  const byId = new Map(misiones.map((m) => [m.id, m]))
  const manual = misiones.filter((m) => !m.auto && !m.id.startsWith("auto-"))
  const auto: LabMissionItem[] = []

  const trials = leads.filter((l) => l.estado === "trial_activo")
  for (const t of trials.slice(0, 2)) {
    auto.push({
      id: `auto-trial-${t.id}`,
      titulo: `Follow-up trial: ${t.nombre}`,
      categoria: "Ventas",
      prioridad: "alta",
      completada: false,
      impacto: "Trial sin cierre = plata que se esfuma",
      auto: true,
    })
  }

  const friosConTel = leads.filter((l) => l.estado === "frio" && l.telefono)
  if (friosConTel.length >= 3) {
    auto.push({
      id: "auto-wa-frios",
      titulo: `Mandar WA a 3 fríos con teléfono (${friosConTel.length} disponibles)`,
      categoria: "Ventas",
      prioridad: "alta",
      completada: false,
      impacto: "Llenar el embudo de contactados",
      auto: true,
    })
  }

  if (signals.deudoresFiado >= 3 && !signals.leoActivo) {
    auto.push({
      id: "auto-leo-demo",
      titulo: "Activar Leo y probar un borrador de cobranza en tu tenant",
      categoria: "Producto",
      prioridad: "media",
      completada: false,
      impacto: "Demo viva con datos reales de fiado",
      auto: true,
    })
  }

  return [
    ...auto.map((a) => {
      const prev = byId.get(a.id)
      return prev ? { ...a, completada: prev.completada } : a
    }),
    ...manual,
  ]
}

// ─── Public API for route ────────────────────────────────────────────────────

export async function getLabDashboard(empresaId: number): Promise<LabDashboardPayload> {
  const state = await loadLabState(empresaId)
  const signals = await getProductSignals(empresaId)
  const misiones = mergeAutoMissions(state.misiones, state.leads, signals)
  const leads = enrichLeadsWithScore(state.leads).sort(
    (a, b) => (b.score ?? 0) - (a.score ?? 0),
  )

  // persist merged auto mission completions skeleton without wiping
  state.misiones = misiones
  await saveLabState(empresaId, state)

  return {
    ok: true,
    metricas: calcularMetricasLab(leads),
    leads,
    misiones,
    regulaciones: LAB_REGULATIONS,
    hitoss: LAB_MILESTONES,
    nextAction: computeNextAction(leads, misiones, signals),
    productSignals: signals,
    eventos: state.eventos.slice(0, 20),
    waLogs: state.waLogs.slice(0, 15),
    abStats: state.abStats,
    funnel: computeFunnel(leads),
    pitchPacks: buildPitchPacks(state.abStats),
  }
}

export async function labToggleMission(empresaId: number, missionId: string) {
  const state = await loadLabState(empresaId)
  const signals = await getProductSignals(empresaId)
  let misiones = mergeAutoMissions(state.misiones, state.leads, signals)
  const idx = misiones.findIndex((m) => m.id === missionId)
  if (idx >= 0) {
    misiones[idx] = { ...misiones[idx], completada: !misiones[idx].completada }
    pushEvent(
      state,
      "mission_toggle",
      `Misión ${misiones[idx].completada ? "hecha" : "reabierta"}: ${misiones[idx].titulo}`,
      { missionId },
    )
  }
  state.misiones = misiones
  await saveLabState(empresaId, state)
  return getLabDashboard(empresaId)
}

export async function labUpdateLeadStatus(
  empresaId: number,
  leadId: string,
  estado: LabLeadEstado,
) {
  const state = await loadLabState(empresaId)
  state.leads = state.leads.map((l) =>
    l.id === leadId
      ? { ...l, estado, ultimoContacto: new Date().toISOString().slice(0, 10) }
      : l,
  )
  const lead = state.leads.find((l) => l.id === leadId)
  pushEvent(state, "lead_status", `${lead?.nombre ?? leadId} → ${estado}`, { leadId, estado })
  await saveLabState(empresaId, state)
  return getLabDashboard(empresaId)
}

export async function labAddLead(
  empresaId: number,
  lead: Partial<LabLeadItem> & { nombre: string },
) {
  const state = await loadLabState(empresaId)
  const newLead: LabLeadItem = {
    id: `lead-${Date.now()}`,
    nombre: lead.nombre.trim(),
    direccion: lead.direccion || "Rosario",
    zona: lead.zona || "Echesortu",
    rubro: lead.rubro || "Almacén",
    estado: "frio",
    productoTarget: lead.productoTarget || "Fiado + Leo Cobranza",
    mrrEstimado: Number(lead.mrrEstimado) || 19900,
    ultimoContacto: new Date().toISOString().slice(0, 10),
    telefono: lead.telefono || "",
    waEnviados: 0,
    createdAt: new Date().toISOString(),
  }
  state.leads = [newLead, ...state.leads]
  pushEvent(state, "lead_add", `Nuevo prospecto: ${newLead.nombre}`, { leadId: newLead.id })
  await saveLabState(empresaId, state)
  return getLabDashboard(empresaId)
}

export async function labLogWaClick(
  empresaId: number,
  leadId: string,
  variant: "A" | "B" | "custom" = "A",
) {
  const state = await loadLabState(empresaId)
  const lead = state.leads.find((l) => l.id === leadId)
  if (!lead) throw new Error("Lead no encontrado")

  const preview = buildWaMessage(lead, variant === "custom" ? "A" : variant)
  state.leads = state.leads.map((l) =>
    l.id === leadId
      ? {
          ...l,
          waEnviados: (l.waEnviados ?? 0) + 1,
          ultimoContacto: new Date().toISOString().slice(0, 10),
          estado: l.estado === "frio" ? "contactado" : l.estado,
          pitchVariant: variant === "custom" ? l.pitchVariant : variant,
        }
      : l,
  )
  state.waLogs = [
    {
      id: `wa-${Date.now()}`,
      leadId,
      leadNombre: lead.nombre,
      variant,
      preview,
      createdAt: new Date().toISOString(),
    },
    ...state.waLogs,
  ].slice(0, 50)

  bumpAb(state, `lead-wa:${variant}`, "waClicks")
  pushEvent(state, "wa_click", `WA → ${lead.nombre} (var ${variant})`, { leadId, variant })
  await saveLabState(empresaId, state)
  return getLabDashboard(empresaId)
}

export async function labTrackCopy(
  empresaId: number,
  packId: string,
  variant: "A" | "B",
) {
  const state = await loadLabState(empresaId)
  bumpAb(state, `${packId}:${variant}`, "copies")
  pushEvent(state, "copy_pitch", `Copiaste pitch ${packId} variante ${variant}`, {
    packId,
    variant,
  })
  await saveLabState(empresaId, state)
  return getLabDashboard(empresaId)
}

export async function labResetDemoData(empresaId: number) {
  const state = await seedState(empresaId)
  pushEvent(state, "reset", "Datos demo del Lab reiniciados")
  await saveLabState(empresaId, state)
  return getLabDashboard(empresaId)
}

export function buildRuleBasedInsight(
  leads: LabLeadItem[],
  misiones: LabMissionItem[],
  signals: LabProductSignals,
): string {
  const scored = enrichLeadsWithScore(leads)
  const top = scored.filter((l) => l.estado !== "perdido" && l.estado !== "cliente")[0]
  const frios = leads.filter((l) => l.estado === "frio").length
  const trials = leads.filter((l) => l.estado === "trial_activo").length
  const mPending = misiones.filter((m) => !m.completada).length

  const lines = [
    `• Prioridad: ${top ? `${top.nombre} (score ${top.score}) — ${top.scoreReasons?.[0] ?? top.estado}` : "cargá un lead con teléfono"}`,
    `• Zona: ${top?.zona ?? "Echesortu/Pellegrini"} · Pipeline frios=${frios} trials=${trials} misiones abiertas=${mPending}`,
    `• Producto en tu tenant: ${signals.deudoresFiado} deudores fiado · Leo ${signals.leoActivo ? "ON" : "OFF"} · SKUs ${signals.skusActivos.slice(0, 3).join(", ") || "ninguno"}`,
    `• Argumento: factura AFIP en mostrador + libreta que cobra (no Excel).`,
  ]
  return lines.join("\n")
}
