import { describe, it, expect } from "vitest"
import { resolveDocSlug } from "@/lib/docs/path-to-slug"

describe("resolveDocSlug", () => {
  it("debe resolver matches exactos", () => {
    expect(resolveDocSlug("/dashboard/pos/cierre")).toBe("funcional/sistema-pos")
    expect(resolveDocSlug("/dashboard/contabilidad/plan-cuentas")).toBe("funcional/tesoreria")
    expect(resolveDocSlug("/dashboard/contabilidad/periodos")).toBe("funcional/tesoreria")
  })

  it("debe resolver matches por prefijo", () => {
    expect(resolveDocSlug("/dashboard/pos")).toBe("funcional/sistema-pos")
    expect(resolveDocSlug("/dashboard/pos/ventas")).toBe("funcional/sistema-pos")
    expect(resolveDocSlug("/dashboard/caja")).toBe("funcional/tesoreria")
    expect(resolveDocSlug("/dashboard/caja/movimientos")).toBe("funcional/tesoreria")
    expect(resolveDocSlug("/dashboard/contabilidad")).toBe("funcional/tesoreria")
    expect(resolveDocSlug("/dashboard/contabilidad/asiento/123")).toBe("funcional/tesoreria")
  })

  it("debe priorizar el prefijo más largo y específico", () => {
    // "/dashboard/contabilidad/plan-cuentas" es exacto -> slug: "funcional/tesoreria"
    // "/dashboard/contabilidad" es prefijo
    expect(resolveDocSlug("/dashboard/contabilidad/plan-cuentas")).toBe("funcional/tesoreria")
    
    // "/dashboard/hospitalidad/platos" es exacto -> "funcional/rubros/otros-rubros"
    // "/dashboard/hospitalidad" es prefijo -> "funcional/rubros/otros-rubros"
    expect(resolveDocSlug("/dashboard/hospitalidad/platos")).toBe("funcional/rubros/otros-rubros")
    expect(resolveDocSlug("/dashboard/hospitalidad/mesas/12")).toBe("funcional/rubros/otros-rubros")
  })

  it("debe tolerar barras diagonales finales (trailing slashes)", () => {
    expect(resolveDocSlug("/dashboard/pos/")).toBe("funcional/sistema-pos")
    expect(resolveDocSlug("/dashboard/caja/")).toBe("funcional/tesoreria")
    expect(resolveDocSlug("/dashboard/contabilidad/plan-cuentas/")).toBe("funcional/tesoreria")
  })

  it("debe caer en fallback (index) para rutas no encontradas", () => {
    expect(resolveDocSlug("/dashboard/algun-modulo-inexistente")).toBe("index")
    expect(resolveDocSlug("/dashboard/raro/modulo/interno")).toBe("index")
    expect(resolveDocSlug("/")).toBe("index")
  })

  it("debe resolver correctamente la ruta base de documentación", () => {
    expect(resolveDocSlug("/dashboard/documentacion")).toBe("index")
    expect(resolveDocSlug("/dashboard/documentacion/")).toBe("index")
  })

  it("debe resolver correctamente módulos impositivos y configuraciones", () => {
    expect(resolveDocSlug("/dashboard/impuestos/iibb")).toBe("funcional/tesoreria")
    expect(resolveDocSlug("/dashboard/impuestos/padron")).toBe("funcional/tesoreria")
    expect(resolveDocSlug("/dashboard/puntos-venta")).toBe("funcional/sistema-pos")
  })

  it("debe resolver correctamente módulos de IA y automatización", () => {
    expect(resolveDocSlug("/dashboard/onboarding")).toBe("funcional/modulo-ia")
    expect(resolveDocSlug("/dashboard/ia")).toBe("funcional/modulo-ia")
    expect(resolveDocSlug("/dashboard/automatizacion")).toBe("funcional/automation-hub")
  })

  it("debe resolver correctamente historias clínicas y veterinaria", () => {
    expect(resolveDocSlug("/dashboard/veterinaria")).toBe("funcional/rubros/veterinaria")
    expect(resolveDocSlug("/dashboard/historia-clinica")).toBe("funcional/rubros/veterinaria")
  })
})
