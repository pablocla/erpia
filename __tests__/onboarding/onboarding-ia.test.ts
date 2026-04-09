import { describe, expect, it } from "vitest"
import { generarConfiguracionOnboarding, getRubroUx, normalizeRubroValue } from "@/lib/onboarding/onboarding-ia"

describe("onboarding-ia", () => {
  it("normalizes rubro aliases", () => {
    expect(normalizeRubroValue("gastronomia")).toBe("bar_restaurant")
    expect(normalizeRubroValue("salud")).toBe("clinica")
    expect(normalizeRubroValue("unknown")).toBe("otro")
  })

  it("provides rubro ux config", () => {
    const ux = getRubroUx("kiosco")
    expect(ux.quickActions.length).toBeGreaterThan(0)
    expect(ux.maestrosCriticos.length).toBeGreaterThan(0)
  })

  it("generates config with ux fields", () => {
    const config = generarConfiguracionOnboarding({
      rubro: "kiosco",
      tamano: "micro",
      tieneStock: true,
      tienePersonal: false,
      necesitaFacturacion: true,
      necesitaContabilidad: false,
      condicionAfip: "monotributista",
      tieneLocal: true,
      tieneDelivery: false,
    })

    expect(config.maestrosCriticos.length).toBeGreaterThan(0)
    expect(config.flujosCriticos.length).toBeGreaterThan(0)
  })
})
