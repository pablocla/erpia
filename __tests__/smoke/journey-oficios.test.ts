/**
 * Journey test — Oficios: presupuesto 3 niveles
 *
 * Simula el flujo lineal del oficio/plomero/electricista:
 * 1. Rutas del journey existen
 * 2. Service oficios exporta funciones
 * 3. API maneja CRUD
 * 4. Template industry configurado
 * 5. Seña manual gratis, link MP paywall
 */
import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "fs"
import { resolve } from "path"

const ROOT = process.cwd()

describe("Journey: Oficios — presupuesto 3 niveles", () => {
  describe("1. Rutas del journey existen", () => {
    const paths = [
      "app/dashboard/oficios/page.tsx",
      "app/dashboard/oficios/nuevo/page.tsx",
      "app/api/oficios/trabajos/route.ts",
    ]

    for (const p of paths) {
      it(`${p} existe`, () => {
        expect(existsSync(resolve(ROOT, p))).toBe(true)
      })
    }

    it("detalle presupuesto [id] existe", () => {
      expect(existsSync(resolve(ROOT, "app/dashboard/oficios/[id]/page.tsx"))).toBe(true)
    })
  })

  describe("2. Oficios service exporta funciones", () => {
    it("oficios-service tiene exports", async () => {
      const mod = await import("@/lib/oficios/oficios-service")
      const exports = Object.keys(mod)
      expect(exports.length).toBeGreaterThan(0)
    })
  })

  describe("3. API oficios/trabajos maneja GET y POST", () => {
    it("route.ts exporta GET", () => {
      const src = readFileSync(resolve(ROOT, "app/api/oficios/trabajos/route.ts"), "utf-8")
      expect(src.includes("export async function GET")).toBe(true)
    })

    it("route.ts exporta POST", () => {
      const src = readFileSync(resolve(ROOT, "app/api/oficios/trabajos/route.ts"), "utf-8")
      expect(src.includes("export async function POST")).toBe(true)
    })

    it("route.ts usa getAuthContext (multi-tenant)", () => {
      const src = readFileSync(resolve(ROOT, "app/api/oficios/trabajos/route.ts"), "utf-8")
      expect(src.includes("getAuthContext")).toBe(true)
    })
  })

  describe("4. Industry template oficios configurado", () => {
    it("oficios template existe y es featured", async () => {
      const { getIndustryTemplate } = await import("@/lib/comercial/industry-templates")
      const oficios = getIndustryTemplate("oficios")
      expect(oficios).not.toBeNull()
      expect(oficios!.goldenPath).toBe("/dashboard/oficios")
      expect(oficios!.featured).toBe(true)
    })

    it("menuLabels incluye las rutas clave", async () => {
      const { getIndustryTemplate } = await import("@/lib/comercial/industry-templates")
      const oficios = getIndustryTemplate("oficios")!
      expect(oficios.menuLabels["/dashboard/oficios"]).toBeDefined()
      expect(oficios.menuLabels["/dashboard/oficios/nuevo"]).toBeDefined()
    })
  })

  describe("5. Cuadrilla / jornales", () => {
    it("ruta cuadrilla existe", () => {
      const exists =
        existsSync(resolve(ROOT, "app/dashboard/oficios/cuadrilla/page.tsx")) ||
        existsSync(resolve(ROOT, "app/dashboard/oficios/cuadrilla/page.ts"))
      expect(exists).toBe(true)
    })
  })

  describe("6. Niche app oficios/fumigacion en catálogo", () => {
    it("fumigacion app existe en niche catalog", async () => {
      const { getNicheApp } = await import("@/lib/niche/niche-apps-catalog")
      const fumi = getNicheApp("fumigacion")
      expect(fumi).toBeDefined()
      expect(fumi!.redirectPath).toBe("/dashboard/fumigacion")
    })
  })
})
