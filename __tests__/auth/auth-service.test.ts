/**
 * AuthService — JWT token lifecycle (sin DB real)
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { AuthService } from "@/lib/auth/auth-service"

const service = new AuthService()

beforeEach(() => {
  vi.clearAllMocks()
})

describe("AuthService JWT", () => {
  it("genera y verifica un token válido con empresaId", async () => {
    const payload = {
      userId: 42,
      email: "cajero@test.com",
      rol: "cajero",
      empresaId: 7,
    }

    const token = await service.generarToken(payload)
    expect(token).toBeTruthy()
    expect(typeof token).toBe("string")

    const decoded = await service.verificarToken(token)
    expect(decoded).toMatchObject(payload)
  })

  it("rechaza token inválido o manipulado", async () => {
    const decoded = await service.verificarToken("token.invalido.fake")
    expect(decoded).toBeNull()
  })
})

describe("AuthService login", () => {
  it("rechaza credenciales inexistentes", async () => {
    mockPrismaClient.usuario.findUnique.mockResolvedValue(null)

    const result = await service.login("nadie@test.com", "secret")
    expect(result.success).toBe(false)
    expect(result.error).toContain("Credenciales")
  })

  it("rechaza usuario inactivo", async () => {
    mockPrismaClient.usuario.findUnique.mockResolvedValue({
      id: 1,
      email: "inactivo@test.com",
      password: "$2a$10$fakehash",
      activo: false,
      rol: "cajero",
      empresaId: 1,
    })

    const result = await service.login("inactivo@test.com", "secret")
    expect(result.success).toBe(false)
    expect(result.error).toContain("inactivo")
  })
})