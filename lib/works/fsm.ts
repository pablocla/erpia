import type { WorksProjectStatus } from "@prisma/client"

/** Canonical forward order (Cancelado is a terminal side-exit). */
export const WORKS_STATUS_ORDER: WorksProjectStatus[] = [
  "Lead",
  "Calificado",
  "Presupuesto",
  "Sena",
  "MatchPartner",
  "EnEjecucion",
  "Entregado",
  "Cobrado",
]

export const WORKS_STATUS_LABEL: Record<WorksProjectStatus, string> = {
  Lead: "Lead",
  Calificado: "Calificado",
  Presupuesto: "Presupuesto",
  Sena: "Seña",
  MatchPartner: "Match partner",
  EnEjecucion: "En ejecución",
  Entregado: "Entregado",
  Cobrado: "Cobrado",
  Cancelado: "Cancelado",
}

const FORWARD = new Map<WorksProjectStatus, WorksProjectStatus>([
  ["Lead", "Calificado"],
  ["Calificado", "Presupuesto"],
  ["Presupuesto", "Sena"],
  ["Sena", "MatchPartner"],
  ["MatchPartner", "EnEjecucion"],
  ["EnEjecucion", "Entregado"],
  ["Entregado", "Cobrado"],
])

export type TransitionContext = {
  senaPagada?: boolean
  hasPresupuesto?: boolean
  partnerId?: string | null
  adminOverride?: boolean
}

export function canTransition(
  from: WorksProjectStatus,
  to: WorksProjectStatus,
  ctx: TransitionContext = {},
): { ok: true } | { ok: false; error: string } {
  if (from === to) return { ok: false, error: "Ya está en ese estado" }
  if (from === "Cancelado" || from === "Cobrado") {
    return { ok: false, error: `Estado terminal: ${from}` }
  }
  if (to === "Cancelado") return { ok: true }

  const expected = FORWARD.get(from)
  if (expected !== to) {
    return {
      ok: false,
      error: `Transición inválida: ${from} → ${to}. Esperado: ${expected ?? "ninguna"}`,
    }
  }

  // PRD §8.B: no MatchPartner without Presupuesto+Seña (unless admin override)
  if (to === "MatchPartner") {
    const presupuestoOk = ctx.hasPresupuesto !== false // allow if unknown; enforce when false
    const senaOk = ctx.senaPagada === true
    if ((!senaOk || ctx.hasPresupuesto === false) && !ctx.adminOverride) {
      return {
        ok: false,
        error: "MatchPartner requiere Presupuesto + Seña pagada (o override admin)",
      }
    }
    void presupuestoOk
  }

  if (to === "EnEjecucion" && !ctx.partnerId && !ctx.adminOverride) {
    return { ok: false, error: "EnEjecucion requiere partner asignado" }
  }

  return { ok: true }
}

export function nextStatus(from: WorksProjectStatus): WorksProjectStatus | null {
  return FORWARD.get(from) ?? null
}
