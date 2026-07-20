/**
 * Checklist comercial go-live por tenant (Oleada 0).
 * Persistido en parametroFiscal clave `commercial_go_live_checklist`.
 * Ver docs/GO_LIVE_PRD.md §6 y docs/PRODUCTO_VENDIBLE_END_TO_END.md Oleada 0.
 */

import { prisma } from "@/lib/prisma"
import { getEmpresaReadiness } from "@/lib/ops/readiness-service"
import { getEnvPresenceChecklist, isMpMockMode } from "@/lib/config/env"
import { GO_LIVE_PACKS_PRD } from "@/lib/comercial/go-live-packs"

export const TOS_VERSION = "2026-07-18"
export const PRIVACY_VERSION = "2026-07-18"

const CHECKLIST_CLAVE = "commercial_go_live_checklist"
const TOS_CLAVE = "tos_accepted"
const PAIS = "AR"

export type ChecklistItemDef = {
  id: string
  label: string
  group: "plataforma" | "comercial" | "fiscal" | "comms" | "smoke" | "handoff"
  required: boolean
}

/** Checklist §6 GO_LIVE_PRD — ítems que el analista marca a mano */
export const COMMERCIAL_GO_LIVE_ITEMS: ChecklistItemDef[] = [
  { id: "pack_prd", label: "Pack es §3.1 PRD (no solo demo)", group: "comercial", required: true },
  { id: "usuarios_roles", label: "Usuarios y roles operativos cargados", group: "plataforma", required: true },
  { id: "skus_activos", label: "SKUs del pack activos y verificados", group: "plataforma", required: true },
  { id: "pago_o_ancla", label: "Trial/pago MP o ancla gratis confirmada", group: "comercial", required: true },
  { id: "cuit_real", label: "CUIT real (no DEMO-*)", group: "fiscal", required: true },
  { id: "datos_maestros", label: "Productos/clientes del cliente (no solo seed)", group: "comercial", required: true },
  { id: "caja_prueba", label: "Caja de prueba abierta/cerrada OK", group: "smoke", required: true },
  { id: "golden_path", label: "Smoke golden path sin 401/500", group: "smoke", required: true },
  { id: "afip_o_no_aplica", label: "AFIP homolog/prod documentado o N/A", group: "fiscal", required: false },
  { id: "wa_o_no_aplica", label: "WhatsApp real o deshabilitado en contrato", group: "comms", required: false },
  { id: "capacitacion", label: "Capacitación 1 rol operativo hecha", group: "handoff", required: true },
  { id: "soporte_canal", label: "Canal soporte / ticket informado", group: "handoff", required: true },
  { id: "revision_7d", label: "Fecha revisión 7 días agendada", group: "handoff", required: false },
]

export type ChecklistState = {
  version: string
  items: Record<string, { done: boolean; at?: string; by?: string; note?: string }>
  packId?: string
  closedAt?: string | null
  closedBy?: string | null
}

export function emptyChecklistState(): ChecklistState {
  return {
    version: "1",
    items: Object.fromEntries(
      COMMERCIAL_GO_LIVE_ITEMS.map((i) => [i.id, { done: false }]),
    ),
  }
}

export async function getTosAcceptance(empresaId: number): Promise<{
  accepted: boolean
  version?: string
  at?: string
  email?: string
} | null> {
  const row = await prisma.parametroFiscal.findUnique({
    where: {
      empresaId_clave_pais: { empresaId, clave: TOS_CLAVE, pais: PAIS },
    },
  })
  if (!row?.descripcion) return { accepted: false }
  try {
    const parsed = JSON.parse(row.descripcion) as {
      version?: string
      at?: string
      email?: string
    }
    return {
      accepted: true,
      version: parsed.version ?? String(row.descripcion),
      at: parsed.at,
      email: parsed.email,
    }
  } catch {
    return { accepted: Number(row.valor) === 1, version: row.descripcion }
  }
}

export async function persistTosAcceptance(params: {
  empresaId: number
  email: string
  version?: string
}): Promise<void> {
  const payload = JSON.stringify({
    version: params.version ?? TOS_VERSION,
    privacyVersion: PRIVACY_VERSION,
    at: new Date().toISOString(),
    email: params.email,
  })
  await prisma.parametroFiscal.upsert({
    where: {
      empresaId_clave_pais: { empresaId: params.empresaId, clave: TOS_CLAVE, pais: PAIS },
    },
    update: { valor: 1, descripcion: payload },
    create: {
      empresaId: params.empresaId,
      clave: TOS_CLAVE,
      valor: 1,
      descripcion: payload,
      categoria: "legal",
      pais: PAIS,
    },
  })
}

export async function getCommercialChecklist(empresaId: number): Promise<ChecklistState> {
  const row = await prisma.parametroFiscal.findUnique({
    where: {
      empresaId_clave_pais: {
        empresaId,
        clave: CHECKLIST_CLAVE,
        pais: PAIS,
      },
    },
  })
  if (!row?.descripcion) return emptyChecklistState()
  try {
    const parsed = JSON.parse(row.descripcion) as ChecklistState
    const base = emptyChecklistState()
    return {
      ...base,
      ...parsed,
      items: { ...base.items, ...parsed.items },
    }
  } catch {
    return emptyChecklistState()
  }
}

export async function saveCommercialChecklist(
  empresaId: number,
  state: ChecklistState,
): Promise<ChecklistState> {
  const required = COMMERCIAL_GO_LIVE_ITEMS.filter((i) => i.required)
  const allRequiredDone = required.every((i) => state.items[i.id]?.done)
  if (allRequiredDone && !state.closedAt) {
    state.closedAt = new Date().toISOString()
  }
  if (!allRequiredDone) {
    state.closedAt = null
    state.closedBy = null
  }

  await prisma.parametroFiscal.upsert({
    where: {
      empresaId_clave_pais: {
        empresaId,
        clave: CHECKLIST_CLAVE,
        pais: PAIS,
      },
    },
    update: {
      valor: allRequiredDone ? 1 : 0,
      descripcion: JSON.stringify(state),
    },
    create: {
      empresaId,
      clave: CHECKLIST_CLAVE,
      valor: allRequiredDone ? 1 : 0,
      descripcion: JSON.stringify(state),
      categoria: "comercial",
      pais: PAIS,
    },
  })
  return state
}

export async function toggleChecklistItem(params: {
  empresaId: number
  itemId: string
  done: boolean
  by: string
  note?: string
  packId?: string
}): Promise<ChecklistState> {
  const state = await getCommercialChecklist(params.empresaId)
  if (!COMMERCIAL_GO_LIVE_ITEMS.some((i) => i.id === params.itemId)) {
    throw new Error(`Ítem desconocido: ${params.itemId}`)
  }
  state.items[params.itemId] = {
    done: params.done,
    at: new Date().toISOString(),
    by: params.by,
    note: params.note,
  }
  if (params.packId) state.packId = params.packId
  if (params.done === false) {
    state.closedAt = null
    state.closedBy = null
  } else {
    const required = COMMERCIAL_GO_LIVE_ITEMS.filter((i) => i.required)
    if (required.every((i) => state.items[i.id]?.done)) {
      state.closedBy = params.by
    }
  }
  return saveCommercialChecklist(params.empresaId, state)
}

export type TenantGoLiveSummary = {
  empresaId: number
  nombre: string
  email: string | null
  rubro: string | null
  cuit: string | null
  readinessScore: number
  listoGoLiveReadiness: boolean
  checklistProgress: { done: number; required: number; closed: boolean }
  tosAccepted: boolean
  mpSubscriptionStatus: string | null
}

/** Resumen para cola Cloud Oleada 0 */
export async function listTenantsGoLiveQueue(limit = 50): Promise<{
  platform: {
    mpMock: boolean
    productionBlocksMock: boolean
    envOk: boolean
    packsPrd: number
  }
  tenants: TenantGoLiveSummary[]
}> {
  const env = getEnvPresenceChecklist()
  const mpMock = isMpMockMode()
  const productionBlocksMock =
    process.env.NODE_ENV === "production" && process.env.FORCE_MOCK_MP_PROD !== "true"

  const empresas = await prisma.empresa.findMany({
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      nombre: true,
      email: true,
      rubro: true,
      cuit: true,
      mpSubscriptionStatus: true,
    },
  })

  const tenants: TenantGoLiveSummary[] = []
  for (const e of empresas) {
    // Skip pure QA demos noise if nombre starts with QA/DEMO fallida
    if (e.nombre.startsWith("[QA") || e.nombre.startsWith("[DEMO FALLIDA]")) continue

    const [readiness, checklist, tos] = await Promise.all([
      getEmpresaReadiness(e.id),
      getCommercialChecklist(e.id),
      getTosAcceptance(e.id),
    ])
    const required = COMMERCIAL_GO_LIVE_ITEMS.filter((i) => i.required)
    const done = required.filter((i) => checklist.items[i.id]?.done).length

    tenants.push({
      empresaId: e.id,
      nombre: e.nombre,
      email: e.email,
      rubro: e.rubro,
      cuit: e.cuit,
      readinessScore: readiness.score,
      listoGoLiveReadiness: readiness.listoGoLive,
      checklistProgress: {
        done,
        required: required.length,
        closed: Boolean(checklist.closedAt),
      },
      tosAccepted: Boolean(tos?.accepted),
      mpSubscriptionStatus: e.mpSubscriptionStatus,
    })
  }

  // Priorizar no cerrados
  tenants.sort((a, b) => {
    if (a.checklistProgress.closed !== b.checklistProgress.closed) {
      return a.checklistProgress.closed ? 1 : -1
    }
    return a.checklistProgress.done - b.checklistProgress.done
  })

  return {
    platform: {
      mpMock,
      productionBlocksMock,
      envOk:
        env.required.DATABASE_URL &&
        env.required.JWT_SECRET &&
        env.billing.MP_ACCESS_TOKEN &&
        env.billing.MP_WEBHOOK_SECRET,
      packsPrd: GO_LIVE_PACKS_PRD.length,
    },
    tenants: tenants.slice(0, limit),
  }
}
