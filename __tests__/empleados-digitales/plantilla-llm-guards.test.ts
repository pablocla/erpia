import { describe, it, expect } from "vitest"
import { plantillaCobranza } from "@/lib/empleados-digitales/tools/generar-recordatorio"

describe("W2 regression plantillas", () => {
  it("CTA no se pierde en formal", () => {
    const m = plantillaCobranza({
      nombreComercio: "X",
      nombreCliente: "Y",
      monto: 9999,
      dias: 3,
      linkPago: "https://mp.example/p",
      tono: "formal",
    })
    expect(m).toContain("https://mp.example/p")
    expect(m).toMatch(/Mercado Pago|pago/i)
  })
})
