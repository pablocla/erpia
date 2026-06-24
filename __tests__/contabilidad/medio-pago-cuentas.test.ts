import { describe, it, expect, vi, beforeEach } from "vitest"
import { resolveCuentaCobro, resolveCuentaPago } from "@/lib/contabilidad/medio-pago-cuentas"

vi.mock("@/lib/config/parametro-service", () => ({
  getCuentaLabel: vi.fn(async (_empresaId: number, _tipo: string, campo: string) => {
    const map: Record<string, string> = {
      caja: "1.1 Caja",
      banco: "1.2 Banco",
      cheques_cartera: "1.1.5 Cheques en Cartera",
      cheques_a_pagar: "2.8 Cheques a Pagar",
    }
    return map[campo] ?? campo
  }),
}))

describe("medio-pago-cuentas", () => {
  beforeEach(() => vi.clearAllMocks())

  it("resolveCuentaCobro usa cheques en cartera para medio cheque", async () => {
    const cuenta = await resolveCuentaCobro(1, "cheque")
    expect(cuenta).toBe("1.1.5 Cheques en Cartera")
  })

  it("resolveCuentaPago usa cheques a pagar para medio cheque", async () => {
    const cuenta = await resolveCuentaPago(1, "cheque")
    expect(cuenta).toBe("2.8 Cheques a Pagar")
  })

  it("resolveCuentaCobro usa caja para efectivo", async () => {
    const cuenta = await resolveCuentaCobro(1, "efectivo")
    expect(cuenta).toBe("1.1 Caja")
  })
})