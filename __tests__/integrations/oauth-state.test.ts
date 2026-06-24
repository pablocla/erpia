import { describe, it, expect } from "vitest"
import { createOAuthState, verifyOAuthState } from "@/lib/integrations/oauth/state"

describe("OAuth state", () => {
  it("crea y verifica state válido", () => {
    const token = createOAuthState({
      empresaId: 1,
      integracionId: "mercado_libre",
      userId: 5,
      returnPath: "/dashboard/conexiones/mercado_libre",
    })
    const payload = verifyOAuthState(token)
    expect(payload?.empresaId).toBe(1)
    expect(payload?.integracionId).toBe("mercado_libre")
    expect(payload?.userId).toBe(5)
  })

  it("rechaza state alterado", () => {
    const token = createOAuthState({
      empresaId: 1,
      integracionId: "tienda_nube",
      userId: 2,
      returnPath: "/x",
    })
    expect(verifyOAuthState(token + "x")).toBeNull()
  })

  it("rechaza state expirado", () => {
    const token = createOAuthState({
      empresaId: 1,
      integracionId: "mercado_libre",
      userId: 1,
      returnPath: "/x",
      ttlSec: -10,
    })
    expect(verifyOAuthState(token)).toBeNull()
  })
})