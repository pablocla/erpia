/**
 * Multi-tenant guard — funciones puras y getAuthContext
 */
import { describe, it, expect, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import {
  whereEmpresa,
  verificarPropietario,
  getAuthContext,
  withAuthAndTenant,
  zodErrorResponse,
} from "@/lib/auth/empresa-guard"
import { z } from "zod"

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

describe("withAuthAndTenant", () => {
  it("rechaza sin token", async () => {
    vi.mocked(verificarToken).mockResolvedValue(null)
    const handler = withAuthAndTenant(async () => NextResponse.json({ ok: true }))
    const res = await handler(new NextRequest("http://localhost/api/test"))
    expect(res.status).toBe(401)
  })

  it("inyecta auth al handler", async () => {
    vi.mocked(verificarToken).mockResolvedValue({
      userId: 7,
      email: "u@test.com",
      rol: "administrador",
      empresaId: 42,
    })
    const handler = withAuthAndTenant(async (_req, auth) =>
      NextResponse.json({ empresaId: auth.empresaId }),
    )
    const res = await handler(
      new NextRequest("http://localhost/api/test", {
        headers: { authorization: "Bearer valid" },
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ empresaId: 42 })
  })

  it("rechaza rol no permitido", async () => {
    vi.mocked(verificarToken).mockResolvedValue({
      userId: 1,
      email: "v@test.com",
      rol: "vendedor",
      empresaId: 3,
    })
    const handler = withAuthAndTenant(
      async () => NextResponse.json({ ok: true }),
      { roles: ["administrador"] },
    )
    const res = await handler(
      new NextRequest("http://localhost/api/test", {
        headers: { authorization: "Bearer valid" },
      }),
    )
    expect(res.status).toBe(403)
  })

  it("captura errores no manejados con 500", async () => {
    vi.mocked(verificarToken).mockResolvedValue({
      userId: 1,
      email: "u@test.com",
      rol: "administrador",
      empresaId: 1,
    })
    const handler = withAuthAndTenant(async () => {
      throw new Error("boom")
    })
    const res = await handler(
      new NextRequest("http://localhost/api/test", {
        headers: { authorization: "Bearer valid" },
      }),
    )
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Error interno del servidor." })
  })
})

describe("zodErrorResponse", () => {
  it("formatea error de validación", async () => {
    const schema = z.object({ id: z.number() })
    const parsed = schema.safeParse({ id: "x" })
    if (parsed.success) throw new Error("expected fail")
    const res = zodErrorResponse(parsed.error)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Payload inválido")
    expect(body.detalles).toBeDefined()
  })
})