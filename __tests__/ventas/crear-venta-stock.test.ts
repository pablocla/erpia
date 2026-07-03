import { describe, expect, it } from "vitest"
import { crearVentaConStockSchema } from "@/lib/schemas/ventas"

describe("POST /api/ventas contract", () => {
  it("valida payload mínimo del Tech Lead", () => {
    const r = crearVentaConStockSchema.safeParse({
      clienteId: 10,
      lineas: [{ productoId: 5, cantidad: 2, precioUnitario: 1500 }],
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.tipo).toBe("B")
    }
  })

  it("rechaza sin líneas", () => {
    const r = crearVentaConStockSchema.safeParse({ clienteId: 1, lineas: [] })
    expect(r.success).toBe(false)
  })
})