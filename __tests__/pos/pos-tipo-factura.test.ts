import { describe, expect, it } from "vitest"
import { tipoFacturaSugerido, letraDesdeTipoCbte } from "@/lib/pos/pos-tipo-factura"

describe("pos-tipo-factura", () => {
  it("sugiere Factura A para RI", () => {
    expect(tipoFacturaSugerido("Responsable Inscripto")).toBe("A")
    expect(tipoFacturaSugerido("RESPONSABLE_INSCRIPTO")).toBe("A")
  })

  it("sugiere Factura B para consumidor final", () => {
    expect(tipoFacturaSugerido("Consumidor Final")).toBe("B")
    expect(tipoFacturaSugerido("CONSUMIDOR_FINAL")).toBe("B")
  })

  it("mapea FCE MiPyME a letra", () => {
    expect(letraDesdeTipoCbte(201)).toBe("A")
    expect(letraDesdeTipoCbte(206)).toBe("B")
  })
})