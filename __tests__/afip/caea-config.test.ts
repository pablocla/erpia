import { describe, it, expect } from "vitest"
import {
  debeIntentarCaea,
  isAfipNetworkError,
  CAEA_MODO_LABELS,
  type CaeaConfig,
} from "@/lib/afip/caea-config"

describe("caea-config", () => {
  const base: CaeaConfig = {
    habilitado: true,
    modoEmision: 0,
    autoInformar: true,
    autoSolicitar: false,
  }

  it("debeIntentarCaea — fallback cuando modo 0 y habilitado", () => {
    expect(debeIntentarCaea(base, "fallback")).toBe(true)
    expect(debeIntentarCaea({ ...base, modoEmision: 1 }, "fallback")).toBe(false)
    expect(debeIntentarCaea({ ...base, habilitado: false }, "fallback")).toBe(false)
  })

  it("debeIntentarCaea — preferir solo en modo 2", () => {
    expect(debeIntentarCaea(base, "preferir")).toBe(false)
    expect(debeIntentarCaea({ ...base, modoEmision: 2 }, "preferir")).toBe(true)
  })

  it("isAfipNetworkError detecta errores de conectividad", () => {
    expect(isAfipNetworkError(new Error("ECONNREFUSED"))).toBe(true)
    expect(isAfipNetworkError(new Error("ETIMEDOUT"))).toBe(true)
    expect(isAfipNetworkError(new Error("AFIP rechazó comprobante"))).toBe(false)
  })

  it("CAEA_MODO_LABELS tiene 3 modos", () => {
    expect(Object.keys(CAEA_MODO_LABELS)).toHaveLength(3)
  })
})