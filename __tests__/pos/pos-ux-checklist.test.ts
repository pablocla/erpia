import { describe, it, expect } from "vitest"
import { POS_UX_FLOWS, POS_DEVICE_VIEWPORTS, listarCriteriosTotales, POS_ARCHIVOS_CRITICOS } from "@/lib/pos/pos-ux-checklist"
import { ordenarClientesPos } from "@/lib/pos/pos-feedback"

describe("pos-ux-checklist", () => {
  it("define flujos críticos incluyendo fiado", () => {
    expect(POS_UX_FLOWS.venta_fiado).toBeDefined()
    expect(POS_UX_FLOWS.cobro_modal.criterios.some((c) => c.ctaVisibleModal)).toBe(true)
    expect(listarCriteriosTotales()).toBeGreaterThanOrEqual(15)
  })

  it("cubre 3 viewports de prueba", () => {
    expect(POS_DEVICE_VIEWPORTS).toHaveLength(3)
  })

  it("lista archivos críticos POS", () => {
    expect(POS_ARCHIVOS_CRITICOS).toContain("app/dashboard/pos/page.tsx")
    expect(POS_ARCHIVOS_CRITICOS).toContain("lib/pos/pos-layout-config.ts")
  })
})

describe("ordenarClientesPos", () => {
  it("prioriza clientes fiado", () => {
    const sorted = ordenarClientesPos([
      { nombre: "Zeta", fiadoHabilitado: false },
      { nombre: "Ana", fiadoHabilitado: true },
    ])
    expect(sorted[0].nombre).toBe("Ana")
  })
})