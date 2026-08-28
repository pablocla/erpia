import { describe, expect, it } from "vitest"
import {
  PRODUCT_SHELLS,
  getActiveProductShell,
  productShellHomePath,
} from "@/lib/comercial/product-shell"
import { SUB_SAAS_SLUGS } from "@/lib/comercial/sub-saas-catalog"

describe("product-shell", () => {
  it("define shell para los 10 slugs sub-saas", () => {
    for (const slug of SUB_SAAS_SLUGS) {
      expect(PRODUCT_SHELLS[slug as keyof typeof PRODUCT_SHELLS]).toBeDefined()
      expect(PRODUCT_SHELLS[slug as keyof typeof PRODUCT_SHELLS].tabs.length).toBeGreaterThan(0)
      expect(PRODUCT_SHELLS[slug as keyof typeof PRODUCT_SHELLS].kpis).toHaveLength(4)
    }
  })

  it("resuelve fiado por modoLite sin SKUs cargados", () => {
    const shell = getActiveProductShell("fiado", null)
    expect(shell?.slug).toBe("fiado")
    expect(shell?.marca).toBe("Claver Fiado")
  })

  it("resuelve cobra por SKU activo", () => {
    const shell = getActiveProductShell("cobranza", { "intang.cobranzas_wa": true })
    expect(shell?.slug).toBe("cobra")
  })

  it("retorna null en modo completo", () => {
    expect(getActiveProductShell("completo", { "pos.fiado_barrio": true })).toBeNull()
  })

  it("home path es primer tab", () => {
    const shell = getActiveProductShell("fiado", null)!
    expect(productShellHomePath(shell)).toBe("/dashboard/fiado")
  })

  it("ancla fiado y oficios muestran Extra con disparo WA/ARCA", () => {
    const extrasFiado = PRODUCT_SHELLS.fiado.tabs.filter((t) => t.badge === "Extra")
    expect(extrasFiado.length).toBeGreaterThanOrEqual(2)
    expect(extrasFiado.some((t) => t.disparo === "whatsapp_outbound")).toBe(true)
    expect(extrasFiado.some((t) => t.disparo === "factura_afip")).toBe(true)
    const extrasOficios = PRODUCT_SHELLS.oficios.tabs.filter((t) => t.badge === "Extra")
    expect(extrasOficios.some((t) => t.disparo === "factura_afip")).toBe(true)
  })
})