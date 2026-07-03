import { describe, expect, it } from "vitest"
import { readPrwSource } from "@/lib/legacy-bridge/prw-service"
import {
  CLAVER_APP_TECHNICAL_BULLETINS,
  formatTechnicalBulletin,
  getTechnicalBulletinBySku,
} from "@/lib/legacy-bridge/technical-bulletins"

describe("Legacy Bridge — boletines técnicos Protheus", () => {
  it("hay un boletín por cada Claver App Edge", () => {
    expect(CLAVER_APP_TECHNICAL_BULLETINS.length).toBe(5)
    for (const b of CLAVER_APP_TECHNICAL_BULLETINS) {
      expect(b.camposCustom.length).toBeGreaterThan(0)
      expect(b.flujosDatos.length).toBeGreaterThan(0)
      expect(b.archivosPrw.length).toBeGreaterThan(0)
      expect(b.ordenCompilacion.length).toBeGreaterThan(0)
    }
  })

  it("cada boletín referencia archivos .PRW existentes en el repo", () => {
    for (const b of CLAVER_APP_TECHNICAL_BULLETINS) {
      for (const prw of b.archivosPrw) {
        expect(prw.archivo.toUpperCase()).toMatch(/\.PRW$/)
        const content = readPrwSource(prw.rutaRepo)
        expect(content).toContain("#Include")
        const isRest = prw.exponeEndpoints.length > 0
        if (isRest) {
          expect(content).toContain("WSRESTFUL")
        } else {
          expect(content).toMatch(/User Function|Static Function/)
        }
        expect(content.length).toBeGreaterThan(100)
      }
    }
  })

  it("genera markdown con campos, flujos y checklist", () => {
    const bulletin = getTechnicalBulletinBySku("edge.expenses")
    expect(bulletin).toBeDefined()
    const md = formatTechnicalBulletin(bulletin!)
    expect(md).toContain("Boletín Técnico Protheus")
    expect(md).toContain("ZCL010")
    expect(md).toContain("CLVEXP01.PRW")
    expect(md).toContain("Flujos de ingreso")
    expect(md).toContain("Checklist de implementación")
  })

  it("edge.expenses incluye punto de entrada para inyección SE1", () => {
    const bulletin = getTechnicalBulletinBySku("edge.expenses")
    expect(bulletin?.archivosPrw.some((p) => p.archivo === "CLVEXP02.PRW")).toBe(true)
    expect(bulletin?.flujosDatos.some((f) => f.destino.includes("SE1"))).toBe(true)
  })
})