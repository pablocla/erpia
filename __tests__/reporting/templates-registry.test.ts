import { describe, expect, it } from "vitest"
import {
  getSheetTemplate,
  listSheetTemplates,
  resolveTemplateDefinition,
  SHEET_TEMPLATES,
} from "@/lib/reporting/templates/registry"

describe("templates registry", () => {
  it("expone exactamente 5 plantillas validadas", () => {
    expect(SHEET_TEMPLATES).toHaveLength(5)
    expect(listSheetTemplates()).toHaveLength(5)
  })

  it("resuelve cada plantilla por id", () => {
    const ids = [
      "ventas-mes-rubro",
      "top-clientes",
      "stock-critico",
      "compras-proveedor",
      "resumen-fiscal-iva",
    ]
    for (const id of ids) {
      expect(getSheetTemplate(id)?.id).toBe(id)
    }
  })

  it("refresca filtros de fecha al resolver", () => {
    const t = getSheetTemplate("ventas-mes-rubro")!
    const resolved = resolveTemplateDefinition(t)
    expect(resolved.definicion.filtros.length).toBeGreaterThan(0)
    expect(resolved.definicion.filtros[0].campo).toBe("desde")
  })

  it("plantilla fiscal usa gráfico con IVA", () => {
    const t = getSheetTemplate("resumen-fiscal-iva")!
    expect(t.definicion.chart?.series).toContain("sum_iva")
    expect(t.vista).toBe("grafico")
  })
})