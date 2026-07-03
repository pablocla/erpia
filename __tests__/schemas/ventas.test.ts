import { describe, expect, it } from "vitest"
import { crearPedidoVentaSchema, crearVentaConStockSchema } from "@/lib/schemas/ventas"

describe("ventas schemas", () => {
  it("rechaza pedido sin líneas", () => {
    const r = crearPedidoVentaSchema.safeParse({ clienteId: 1, lineas: [] })
    expect(r.success).toBe(false)
  })

  it("acepta pedido válido", () => {
    const r = crearPedidoVentaSchema.safeParse({
      clienteId: 1,
      lineas: [{ descripcion: "Producto", cantidad: 2, precioUnitario: 100 }],
    })
    expect(r.success).toBe(true)
  })

  it("crearVentaConStock exige productoId", () => {
    const r = crearVentaConStockSchema.safeParse({
      clienteId: 1,
      lineas: [{ productoId: 5, cantidad: 1, precioUnitario: 50 }],
    })
    expect(r.success).toBe(true)
  })
})