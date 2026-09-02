/**
 * Google auth + user management (Grupo Claver)
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

const mockVerify = vi.fn()

vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken(...args: unknown[]) {
      return mockVerify(...args)
    }
  },
}))

vi.mock("@/lib/comercial/activar-producto-service", () => ({
  applyActivarIntent: vi.fn().mockResolvedValue({
    landingPath: "/dashboard/membresias",
    rubro: "gimnasio",
    modoLite: "niche",
    engancheId: "niche.gimnasio_barrio",
    productosCreados: 0,
    skusActivados: [],
    trialExpiresAt: new Date().toISOString(),
  }),
}))

vi.mock("@/lib/auth/auth-service", () => {
  return {
    AuthService: class {
      async generarToken(payload: Record<string, unknown>) {
        return `jwt-${payload.userId}-${payload.empresaId}`
      }
      async verificarToken() {
        return null
      }
    },
  }
})

import {
  authenticateWithGoogle,
  hasOpenInvitation,
  provisionGoogleUser,
  verifyGoogleIdToken,
} from "@/lib/auth/google-auth-service"
import { canManageUsers, isAdminRole, isAssignableRole } from "@/lib/auth/admin-roles"

beforeEach(() => {
  vi.clearAllMocks()
  process.env.GOOGLE_CLIENT_ID = "test-client-id"
})

function mockGoogleTicket(email = "user@gmail.com", sub = "google-sub-1") {
  mockVerify.mockResolvedValue({
    getPayload: () => ({
      email,
      sub,
      name: "Test User",
      picture: "https://example.com/a.png",
      email_verified: true,
    }),
  })
}

describe("admin roles (Grupo Claver)", () => {
  it("dueno y administrador pueden gestionar usuarios", () => {
    expect(canManageUsers("dueno")).toBe(true)
    expect(canManageUsers("administrador")).toBe(true)
    expect(canManageUsers("admin")).toBe(true)
    expect(canManageUsers("propietario")).toBe(true)
    expect(canManageUsers("cajero")).toBe(false)
    expect(isAdminRole("dueno")).toBe(true)
  })

  it("roles asignables a subusuarios", () => {
    expect(isAssignableRole("cajero")).toBe(true)
    expect(isAssignableRole("stakeholder")).toBe(true)
    expect(isAssignableRole("hacker")).toBe(false)
  })
})

describe("verifyGoogleIdToken", () => {
  it("rechaza sin client id", async () => {
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const r = await verifyGoogleIdToken("tok")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(500)
  })

  it("usa NEXT_PUBLIC_GOOGLE_CLIENT_ID si falta GOOGLE_CLIENT_ID", async () => {
    delete process.env.GOOGLE_CLIENT_ID
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client-id"
    mockGoogleTicket()
    const r = await verifyGoogleIdToken("tok")
    expect(r.ok).toBe(true)
  })

  it("rechaza email no verificado", async () => {
    mockVerify.mockResolvedValue({
      getPayload: () => ({
        email: "a@b.com",
        sub: "x",
        email_verified: false,
      }),
    })
    const r = await verifyGoogleIdToken("tok")
    expect(r.ok).toBe(false)
  })

  it("acepta token válido", async () => {
    mockGoogleTicket()
    const r = await verifyGoogleIdToken("tok")
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.payload.email).toBe("user@gmail.com")
      expect(r.payload.sub).toBe("google-sub-1")
    }
  })
})

describe("authenticateWithGoogle", () => {
  it("bloquea free join por empresaId para usuarios nuevos", async () => {
    mockGoogleTicket("nuevo@gmail.com", "sub-new")
    mockPrismaClient.usuario.findFirst.mockResolvedValue(null)

    const r = await authenticateWithGoogle({
      idToken: "tok",
      empresaId: 99,
    })
    expect(r.success).toBe(false)
    if (!r.success && r.error !== "EMPRESA_REQUIRED") {
      expect(r.error).toMatch(/invite/i)
      expect("status" in r && r.status).toBe(403)
    }
  })

  it("pide empresa para usuario nuevo sin empresaNombre", async () => {
    mockGoogleTicket("nuevo@gmail.com", "sub-new")
    mockPrismaClient.usuario.findFirst.mockResolvedValue(null)

    const r = await authenticateWithGoogle({ idToken: "tok" })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error).toBe("EMPRESA_REQUIRED")
  })

  it("loguea usuario activo existente y vincula Google", async () => {
    mockGoogleTicket("existente@gmail.com", "sub-e")
    mockPrismaClient.usuario.findFirst.mockResolvedValue({
      id: 5,
      email: "existente@gmail.com",
      nombre: "Existente",
      rol: "cajero",
      empresaId: 3,
      activo: true,
      password: "hash",
      authProvider: "credentials",
      googleId: null,
      avatarUrl: null,
    })
    mockPrismaClient.usuario.update.mockResolvedValue({
      id: 5,
      email: "existente@gmail.com",
      nombre: "Existente",
      rol: "cajero",
      empresaId: 3,
      activo: true,
      authProvider: "credentials",
      googleId: "sub-e",
      avatarUrl: "https://example.com/a.png",
    })

    const r = await authenticateWithGoogle({ idToken: "tok" })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.token).toContain("jwt-5")
      expect(r.usuario.empresaId).toBe(3)
      expect(r.isNewUser).toBe(false)
    }
  })

  it("activa invitación Google en usuario inactivo con invite abierta", async () => {
    mockGoogleTicket("invitado@gmail.com", "sub-inv")
    mockPrismaClient.usuario.findFirst.mockResolvedValue({
      id: 8,
      email: "invitado@gmail.com",
      nombre: "Invitado",
      rol: "cajero",
      empresaId: 2,
      activo: false,
      password: null,
      authProvider: "google",
      googleId: null,
      avatarUrl: null,
    })
    mockPrismaClient.logActividad.findMany.mockResolvedValue([
      {
        id: 1,
        detalle: JSON.stringify({
          token: "abc",
          userId: 8,
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
        }),
      },
    ])
    mockPrismaClient.usuario.update.mockResolvedValue({
      id: 8,
      email: "invitado@gmail.com",
      nombre: "Invitado",
      rol: "cajero",
      empresaId: 2,
      activo: true,
      authProvider: "google",
      googleId: "sub-inv",
      avatarUrl: "https://example.com/a.png",
    })
    mockPrismaClient.logActividad.update.mockResolvedValue({})

    const r = await authenticateWithGoogle({ idToken: "tok" })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.activatedInvite).toBe(true)
      expect(r.usuario.rol).toBe("cajero")
    }
  })

  it("bloquea usuario inactivo sin invitación", async () => {
    mockGoogleTicket("off@gmail.com", "sub-off")
    mockPrismaClient.usuario.findFirst.mockResolvedValue({
      id: 9,
      email: "off@gmail.com",
      nombre: "Off",
      rol: "cajero",
      empresaId: 2,
      activo: false,
      password: null,
      authProvider: "google",
      googleId: null,
      avatarUrl: null,
    })
    mockPrismaClient.logActividad.findMany.mockResolvedValue([])

    const r = await authenticateWithGoogle({ idToken: "tok" })
    expect(r.success).toBe(false)
    if (!r.success && r.error !== "EMPRESA_REQUIRED") {
      expect(r.error).toMatch(/inactivo/i)
    }
  })

  it("crea empresa y dueño con empresaNombre", async () => {
    mockGoogleTicket("owner@gmail.com", "sub-owner")
    mockPrismaClient.usuario.findFirst.mockResolvedValue(null)
    mockPrismaClient.empresa.create.mockResolvedValue({ id: 100, nombre: "Mi Comercio" })
    mockPrismaClient.usuario.create.mockResolvedValue({
      id: 50,
      email: "owner@gmail.com",
      nombre: "Test User",
      rol: "dueno",
      empresaId: 100,
      activo: true,
      authProvider: "google",
      googleId: "sub-owner",
      avatarUrl: "https://example.com/a.png",
    })

    const r = await authenticateWithGoogle({
      idToken: "tok",
      empresaNombre: "Mi Comercio",
      activar: "gimnasio",
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.isNewUser).toBe(true)
      expect(r.usuario.rol).toBe("dueno")
      expect(r.usuario.empresaId).toBe(100)
      expect(r.onboarding?.landingPath).toBe("/dashboard/membresias")
    }
    expect(mockPrismaClient.empresa.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rubro: "gimnasio",
          modoLite: "niche",
        }),
      }),
    )
  })

  it("rechaza googleId distinto con mismo email", async () => {
    mockGoogleTicket("linked@gmail.com", "sub-other")
    mockPrismaClient.usuario.findFirst.mockResolvedValue({
      id: 7,
      email: "linked@gmail.com",
      nombre: "Linked",
      rol: "dueno",
      empresaId: 1,
      activo: true,
      password: null,
      authProvider: "google",
      googleId: "sub-original",
      avatarUrl: "https://x.com/a.png",
    })

    const r = await authenticateWithGoogle({ idToken: "tok" })
    expect(r.success).toBe(false)
    if (!r.success && r.error !== "EMPRESA_REQUIRED") {
      expect(r.error).toMatch(/vinculado/i)
    }
  })
})

describe("hasOpenInvitation", () => {
  it("detecta invitación válida", async () => {
    mockPrismaClient.logActividad.findMany.mockResolvedValue([
      {
        id: 1,
        detalle: JSON.stringify({
          token: "t1",
          userId: 3,
          expiresAt: new Date(Date.now() + 100000).toISOString(),
        }),
      },
    ])
    await expect(hasOpenInvitation(3)).resolves.toBe(true)
  })

  it("ignora invitaciones aceptadas o expiradas", async () => {
    mockPrismaClient.logActividad.findMany.mockResolvedValue([
      {
        id: 1,
        detalle: JSON.stringify({
          token: "t1",
          userId: 3,
          accepted: true,
          expiresAt: new Date(Date.now() + 100000).toISOString(),
        }),
      },
      {
        id: 2,
        detalle: JSON.stringify({
          token: "t2",
          userId: 3,
          expiresAt: new Date(Date.now() - 100000).toISOString(),
        }),
      },
    ])
    await expect(hasOpenInvitation(3)).resolves.toBe(false)
  })
})

describe("provisionGoogleUser", () => {
  it("crea usuario Google inactivo con invitación", async () => {
    mockPrismaClient.usuario.findUnique.mockResolvedValue(null)
    mockPrismaClient.usuario.create.mockResolvedValue({
      id: 22,
      nombre: "Sub",
      email: "sub@gmail.com",
      rol: "cajero",
      activo: false,
      authProvider: "google",
    })
    mockPrismaClient.logActividad.create.mockResolvedValue({ id: 1 })

    const r = await provisionGoogleUser({
      nombre: "Sub",
      email: "sub@gmail.com",
      rol: "cajero",
      empresaId: 1,
      invitedBy: 1,
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.usuario.authProvider).toBe("google")
      expect(r.usuario.activo).toBe(false)
    }
    expect(mockPrismaClient.logActividad.create).toHaveBeenCalled()
  })

  it("rechaza email duplicado", async () => {
    mockPrismaClient.usuario.findUnique.mockResolvedValue({ id: 1 })
    const r = await provisionGoogleUser({
      nombre: "X",
      email: "dup@gmail.com",
      rol: "cajero",
      empresaId: 1,
      invitedBy: 1,
    })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.status).toBe(409)
  })
})
