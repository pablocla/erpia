import { describe, it, expect } from "vitest"
import {
  friendlySkuLabel,
  friendlySkuLabels,
} from "@/lib/platform/sku-friendly-labels"

describe("sku-friendly-labels", () => {
  it("traduce SKUs técnicos a nombres comerciales", () => {
    expect(friendlySkuLabel("sec.backup")).toBe("Respaldos Automáticos")
    expect(friendlySkuLabel("pos.fiado_barrio")).toContain("Fiado Digital")
    expect(friendlySkuLabel("niche.consordos")).toBe("Gestión Consorcios")
  })

  it("colapsa combos de seguridad", () => {
    const labels = friendlySkuLabels(["sec.backup", "sec.mfa", "pos.vale_dinero"])
    expect(labels).toContain("Respaldo y Seguridad")
    expect(labels).toContain("Vales de Dinero")
    expect(labels).not.toContain("sec.backup")
  })

  it("devuelve el sku si no hay mapeo", () => {
    expect(friendlySkuLabel("sku.desconocido.xyz")).toBe("sku.desconocido.xyz")
  })
})
