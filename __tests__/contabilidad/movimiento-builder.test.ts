import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    cuentaContable: { findUnique: vi.fn() },
  },
}))

import { prisma } from "@/lib/prisma"
import { extraerCodigoCuenta, buildMovimiento } from "@/lib/contabilidad/movimiento-builder"

describe("movimiento-builder", () => {
  beforeEach(() => vi.clearAllMocks())

  it("extrae código de label", () => {
    expect(extraerCodigoCuenta("4.1 Ventas")).toBe("4.1")
    expect(extraerCodigoCuenta("1.1.5 Cheques en Cartera")).toBe("1.1.5")
  })

  it("resuelve cuentaContableId cuando existe en plan", async () => {
    vi.mocked(prisma.cuentaContable.findUnique).mockResolvedValue({
      id: 42,
      imputable: true,
      activo: true,
    } as never)

    const mov = await buildMovimiento(1, {
      cuentaLabel: "4.1 Ventas",
      debe: 0,
      haber: 1000,
    })

    expect(mov.cuentaContableId).toBe(42)
    expect(mov.cuenta).toBe("4.1 Ventas")
    expect(mov.haber).toBe(1000)
  })
})