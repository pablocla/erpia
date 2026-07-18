import { describe, expect, it } from "vitest"
import { getNicheLabels, getWorkflowEstados, labelEstado } from "@/lib/niche/niche-labels"

describe("niche-labels", () => {
  it("labels por appId", () => {
    expect(getNicheLabels("escuela").socio).toMatch(/Alumno|familia/i)
    expect(getNicheLabels("gimnasio").membresia).toBe("Pase")
    expect(getNicheLabels("desconocido").socio).toBe("Socio")
  })

  it("workflow plancha incluye listo y entregado", () => {
    const w = getWorkflowEstados("plancha")
    expect(w).toContain("listo")
    expect(w).toContain("entregado")
  })

  it("labelEstado es-AR", () => {
    expect(labelEstado("pendiente")).toBe("Pendiente")
    expect(labelEstado("listo")).toBe("Listo")
  })
})
