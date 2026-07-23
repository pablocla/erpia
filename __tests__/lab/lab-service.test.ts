import { describe, it, expect } from "vitest"
import {
  scoreLead,
  enrichLeadsWithScore,
  calcularMetricasLab,
  computeNextAction,
  computeFunnel,
  buildWaMessage,
  buildRuleBasedInsight,
  type LabLeadItem,
  type LabMissionItem,
  type LabProductSignals,
} from "@/lib/lab/lab-service"

const baseLead = (over: Partial<LabLeadItem> = {}): LabLeadItem => ({
  id: "l1",
  nombre: "Kiosco Test",
  direccion: "Rosario",
  zona: "Echesortu",
  rubro: "Kiosco",
  estado: "frio",
  productoTarget: "Fiado + Leo Cobranza",
  mrrEstimado: 19900,
  telefono: "3415550000",
  ...over,
})

const emptySignals: LabProductSignals = {
  deudoresFiado: 0,
  deudaTotalAbs: 0,
  suscripcionesActivas: 0,
  skusActivos: [],
  leoActivo: false,
  empleadosDigitales: 0,
  trialExpiraEnDias: null,
  empresaNombre: "Test",
}

describe("Claver Lab scoring & actions", () => {
  it("score prioriza trial con teléfono y zona caliente", () => {
    const frio = scoreLead(baseLead({ estado: "frio" }))
    const trial = scoreLead(
      baseLead({ id: "t1", estado: "trial_activo", zona: "Echesortu", telefono: "341" }),
    )
    expect(trial.score).toBeGreaterThan(frio.score)
    expect(trial.score).toBeGreaterThanOrEqual(50)
    expect(trial.reasons.some((r) => r.toLowerCase().includes("trial"))).toBe(true)
  })

  it("cliente paga entra en mrrActual", () => {
    const leads = [
      baseLead({ id: "c1", estado: "cliente", mrrEstimado: 19900 }),
      baseLead({ id: "d1", estado: "demo_agendada", mrrEstimado: 25000 }),
    ]
    const m = calcularMetricasLab(leads)
    expect(m.mrrActual).toBe(19900)
    expect(m.pipelinePotencial).toBe(25000)
    expect(m.clientes).toBe(1)
  })

  it("nextAction prioriza trial sobre frío", () => {
    const leads = [
      baseLead({ id: "f1", estado: "frio", nombre: "Frío" }),
      baseLead({ id: "t1", estado: "trial_activo", nombre: "En Trial" }),
    ]
    const action = computeNextAction(leads, [], emptySignals)
    expect(action.kind).toBe("trial")
    expect(action.leadId).toBe("t1")
    expect(action.title).toContain("En Trial")
  })

  it("nextAction sugiere Leo si hay fiado y Leo off", () => {
    const leads = [baseLead({ estado: "contactado" })]
    const action = computeNextAction(leads, [], {
      ...emptySignals,
      deudoresFiado: 5,
      leoActivo: false,
    })
    expect(action.kind).toBe("product")
    expect(action.title.toLowerCase()).toContain("leo")
  })

  it("funnel cuenta por estado", () => {
    const leads = [
      baseLead({ id: "1", estado: "frio" }),
      baseLead({ id: "2", estado: "frio" }),
      baseLead({ id: "3", estado: "cliente", mrrEstimado: 10000 }),
    ]
    const f = computeFunnel(leads)
    expect(f.find((x) => x.estado === "frio")?.count).toBe(2)
    expect(f.find((x) => x.estado === "cliente")?.mrr).toBe(10000)
  })

  it("WA variantes A y B difieren", () => {
    const lead = baseLead()
    const a = buildWaMessage(lead, "A")
    const b = buildWaMessage(lead, "B")
    expect(a).toContain(lead.nombre)
    expect(b).toContain(lead.zona)
    expect(a).not.toBe(b)
  })

  it("enrichLeadsWithScore ordenable", () => {
    const scored = enrichLeadsWithScore([
      baseLead({ id: "a", estado: "frio" }),
      baseLead({ id: "b", estado: "trial_activo" }),
    ])
    expect(scored.every((l) => typeof l.score === "number")).toBe(true)
  })

  it("rule insight no vacío", () => {
    const missions: LabMissionItem[] = [
      {
        id: "m1",
        titulo: "Test",
        categoria: "Ventas",
        prioridad: "alta",
        completada: false,
        impacto: "x",
      },
    ]
    const text = buildRuleBasedInsight([baseLead()], missions, emptySignals)
    expect(text.length).toBeGreaterThan(20)
    expect(text).toContain("•")
  })
})
