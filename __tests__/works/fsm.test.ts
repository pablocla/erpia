import { describe, expect, it } from "vitest"
import { canTransition, nextStatus } from "@/lib/works/fsm"
import { partnerNetFromCobrado } from "@/lib/works/works-service"

describe("Works FSM", () => {
  it("allows Lead → Calificado", () => {
    expect(canTransition("Lead", "Calificado")).toEqual({ ok: true })
  })

  it("blocks skip ahead", () => {
    const r = canTransition("Lead", "Sena")
    expect(r.ok).toBe(false)
  })

  it("requires seña for MatchPartner unless override", () => {
    const blocked = canTransition("Sena", "MatchPartner", { senaPagada: false })
    expect(blocked.ok).toBe(false)
    const ok = canTransition("Sena", "MatchPartner", { senaPagada: true, hasPresupuesto: true })
    expect(ok).toEqual({ ok: true })
    const override = canTransition("Sena", "MatchPartner", {
      senaPagada: false,
      adminOverride: true,
    })
    expect(override).toEqual({ ok: true })
  })

  it("nextStatus chain", () => {
    expect(nextStatus("Lead")).toBe("Calificado")
    expect(nextStatus("Entregado")).toBe("Cobrado")
    expect(nextStatus("Cobrado")).toBeNull()
  })

  it("partner net = cobrado - comisión", () => {
    expect(partnerNetFromCobrado(1000, 20)).toBe(800)
  })
})
