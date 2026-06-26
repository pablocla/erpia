import { describe, it, expect } from "vitest"
import { labelCajaBadge, mensajeCajaBloqueada } from "@/lib/pos/pos-feedback"

describe("pos-feedback — caja", () => {
  it("distingue motivos en badge", () => {
    expect(labelCajaBadge(true, null)).toBe("Caja OK")
    expect(labelCajaBadge(false, "auth")).toBe("Sin sesión")
    expect(labelCajaBadge(false, "red")).toBe("Sin conexión")
    expect(labelCajaBadge(false, "cerrada")).toBe("Caja cerrada")
  })

  it("mensajes de bloqueo según motivo", () => {
    expect(mensajeCajaBloqueada("auth")).toContain("Sesión expirada")
    expect(mensajeCajaBloqueada("red")).toContain("Sin conexión")
    expect(mensajeCajaBloqueada("cerrada")).toContain("Abrí la caja")
  })
})