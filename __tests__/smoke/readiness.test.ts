/**
 * Smoke / Readiness — verifica que módulos críticos existen y exportan APIs esperadas.
 * Gemini debe correr esto después de cada cambio grande.
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "fs"
import { resolve } from "path"

describe("readiness — módulos críticos", () => {
  it("motor de precios exporta calcularPrecio y calcularPreciosLote", async () => {
    const mod = await import("@/lib/precios/motor-precios")
    expect(mod.calcularPrecio).toBeTypeOf("function")
    expect(mod.calcularPreciosLote).toBeTypeOf("function")
  })

  it("onboarding IA exporta generarConfiguracionOnboarding", async () => {
    const mod = await import("@/lib/onboarding/onboarding-ia")
    expect(mod.generarConfiguracionOnboarding).toBeTypeOf("function")
    expect(mod.normalizeRubroValue("acopio")).toBe("agro_acopio")
  })

  it("auth guard exporta getAuthContext y whereEmpresa", async () => {
    const mod = await import("@/lib/auth/empresa-guard")
    expect(mod.getAuthContext).toBeTypeOf("function")
    expect(mod.whereEmpresa).toBeTypeOf("function")
  })

  it("agent registry tiene agentes registrados", async () => {
    await import("@/lib/ai/agents/bootstrap")
    const mod = await import("@/lib/ai/agents/agent-registry")
    const agentes = mod.agentRegistry.getAll()
    expect(agentes.length).toBeGreaterThanOrEqual(8)
  })
})

describe("readiness — integraciones críticas", () => {
  it("motor de precios está cableado en ventas, POS y portal B2B", () => {
    const ventasSrc = readFileSync(resolve(process.cwd(), "lib/ventas/ventas-service.ts"), "utf-8")
    const posSrc = readFileSync(resolve(process.cwd(), "app/api/pos/venta/route.ts"), "utf-8")
    const portalSrc = readFileSync(resolve(process.cwd(), "app/api/portal/pedidos/route.ts"), "utf-8")
    expect(ventasSrc.includes("resolver-precios-lineas")).toBe(true)
    expect(posSrc.includes("resolver-precios-lineas")).toBe(true)
    expect(portalSrc.includes("resolver-precios-lineas")).toBe(true)
  })

  it("API pendientes por rol existe", () => {
    expect(existsSync(resolve(process.cwd(), "app/api/pendientes/route.ts"))).toBe(true)
  })

  it("vitest incluye carpetas auth, precios y smoke", () => {
    const config = readFileSync(resolve(process.cwd(), "vitest.config.ts"), "utf-8")
    expect(config).toContain("__tests__/**/*.test.ts")
  })
})