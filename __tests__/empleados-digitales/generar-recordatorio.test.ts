import { describe, it, expect } from "vitest"
import { plantillaCobranza } from "@/lib/empleados-digitales/tools/generar-recordatorio"

describe("plantillaCobranza ED-04", () => {
  it("incluye CTA Mercado Pago si hay link", () => {
    const msg = plantillaCobranza({
      nombreComercio: "Kiosco Norte",
      nombreCliente: "Ana",
      monto: 12000,
      dias: 14,
      linkPago: "https://mp.test/pay",
      tono: "cercano",
    })
    expect(msg).toContain("Mercado Pago")
    expect(msg).toContain("https://mp.test/pay")
    expect(msg).toContain("Ana")
  })

  it("sin link no inventa URL", () => {
    const msg = plantillaCobranza({
      nombreComercio: "Kiosco Norte",
      nombreCliente: "Ana",
      monto: 12000,
      dias: 14,
      tono: "formal",
    })
    expect(msg).not.toContain("http")
    expect(msg).toContain("Ana")
  })
})
