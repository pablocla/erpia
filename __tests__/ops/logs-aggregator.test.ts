import { describe, it, expect } from "vitest"
import { logsToCsv } from "@/lib/ops/logs-aggregator"

describe("logs-aggregator", () => {
  it("exporta CSV con header", () => {
    const csv = logsToCsv([
      {
        id: "sistema-1",
        fuente: "sistema",
        severidad: "info",
        categoria: "ops",
        contexto: "job:1",
        mensaje: "OK",
        createdAt: new Date("2026-06-23T12:00:00Z"),
      },
    ])
    expect(csv.startsWith("fecha,fuente,severidad")).toBe(true)
    expect(csv).toContain("sistema")
  })
})