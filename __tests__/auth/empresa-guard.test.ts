/**
 * Multi-tenant guard — funciones puras y getAuthContext
 */
import { describe, it, expect, vi } from "vitest"
import { NextRequest } from "next/server"
import { whereEmpresa, verificarPropietario, getAuthContext } from "@/lib/auth/empresa-guard"

vi.mock("@/lib/auth/middleware", () => ({
  verificarToken: vi.fn(),
}))

import { verificarToken } from "@/lib/auth/middleware"

describe("whereEmpresa", () => {
  it("agrega empresaId al filtro", () => {
    expect(whereEmpresa(5)).toEqual({ empresaId: 5 })
    expect(whereEmpresa(5, { activo: true })).toEqual({ activo: true, empresaId: 5 })
  })
})

describe("verificarPropietario", () => {
  it("valida pertenencia del registro a la empresa", () => {
    expect(verificarPropietario({ empresaId: 3 }, 3)).toBe(true)
    expect(verificarPropietario({ empresaId: 3 }, 9)).toBe(false)
    expect(verificarPropietario(null, 3)).toBe(false)
  })
})

describe("getAuthContext", () => {
  it("retorna 401 sin token", async () => {
    vi.mocked(verificarToken).mockResolvedValue(null)
    const req = new NextRequest("http://localhost/api/clientes")

    const result = await getAuthContext(req)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  it("retorna 403 si el token no trae empresaId", async () => {
    vi.mocked(verificarToken).mockResolvedValue({
      userId: 1,
      email: "a@test.com",
      rol: "dueno",
      empresaId: 0,
    })
    const req = new NextRequest("http://localhost/api/clientes", {
      headers: { authorization: "Bearer fake" },
    })

    const result = await getAuthContext(req)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it("retorna contexto completo con token válido", async () => {
    vi.mocked(verificarToken).mockResolvedValue({
      userId: 10,
      email: "dueno@test.com",
      rol: "dueno",
      empresaId: 4,
    })
    const req = new NextRequest("http://localhost/api/clientes", {
      headers: { authorization: "Bearer valid" },
    })

    const result = await getAuthContext(req)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.auth).toEqual({
        userId: 10,
        email: "dueno@test.com",
        rol: "dueno",
        empresaId: 4,
      })
    }
  })
})