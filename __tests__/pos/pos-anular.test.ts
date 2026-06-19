import { describe, it, expect } from "vitest"
import { parseReferenciaPos } from "@/lib/pos/anular-venta-pos"

describe("parseReferenciaPos", () => {
  it("parsea referencia FAC-B-123", () => {
    expect(parseReferenciaPos("FAC-B-123")).toEqual({ tipo: "B", numero: 123 })
  })

  it("convierte ticket a tipo B", () => {
    expect(parseReferenciaPos("FAC-ticket-5")).toEqual({ tipo: "B", numero: 5 })
  })

  it("retorna null si referencia inválida", () => {
    expect(parseReferenciaPos(null)).toBeNull()
    expect(parseReferenciaPos("VENTA-1")).toBeNull()
  })
})