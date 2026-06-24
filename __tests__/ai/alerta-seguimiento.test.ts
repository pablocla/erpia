import { describe, it, expect } from "vitest"
import { appendSeguimiento, parseAlertaMetadata } from "@/lib/ai/alerta-seguimiento"

describe("alerta-seguimiento", () => {
  it("parsea metadata vacía con defaults", () => {
    const meta = parseAlertaMetadata(null)
    expect(meta.estadoSeguimiento).toBe("pendiente")
    expect(meta.seguimiento).toEqual([])
  })

  it("agrega entrada al timeline", () => {
    const meta = appendSeguimiento(parseAlertaMetadata(null), {
      usuarioId: 1,
      usuarioNombre: "Pablo",
      accion: "nota",
      nota: "Revisar stock",
    })
    expect(meta.seguimiento).toHaveLength(1)
    expect(meta.seguimiento[0].nota).toBe("Revisar stock")
  })
})