import { describe, expect, it } from "vitest"
import { resolveTemplateDefinition } from "@/lib/reporting/templates/registry"
import { getSheetTemplate } from "@/lib/reporting/templates/registry"

describe("template preview definition", () => {
  it("aplica límite compatible con preview al clonar definición", () => {
    const t = getSheetTemplate("stock-critico")!
    const resolved = resolveTemplateDefinition(t)
    const withLimit = { ...resolved.definicion, limit: 150 }
    expect(withLimit.limit).toBe(150)
    expect(withLimit.vista).toBe("plano")
  })

  it("refresca filtros antes de ejecutar preview", () => {
    const t = getSheetTemplate("resumen-fiscal-iva")!
    const resolved = resolveTemplateDefinition(t)
    const hasta = resolved.definicion.filtros.find((f) => f.campo === "hasta")
    expect(hasta?.valor).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})