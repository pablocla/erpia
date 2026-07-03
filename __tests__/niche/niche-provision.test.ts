import { describe, expect, it, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/config/rubro-config-service", () => ({
  setFeature: vi.fn().mockResolvedValue(undefined),
}))

import { setFeature } from "@/lib/config/rubro-config-service"
import { getActiveSubscription, upsertSuscripcion } from "@/lib/platform/commercial-service"
import { activarLibretaFiado } from "@/lib/fiado/fiado-provision"
import { activarNicheApp, NICHE_FEATURE_KEY } from "@/lib/niche/niche-provision"

vi.mock("@/lib/platform/commercial-service", () => ({
  getActiveSubscription: vi.fn(),
  upsertSuscripcion: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/fiado/fiado-provision", () => ({
  activarLibretaFiado: vi.fn().mockResolvedValue({ ok: true }),
}))

const mockGetSub = getActiveSubscription as unknown as ReturnType<typeof vi.fn>
const mockUpsert = upsertSuscripcion as unknown as ReturnType<typeof vi.fn>
const mockFiadoProv = activarLibretaFiado as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSub.mockResolvedValue(null)
  mockPrismaClient.empresa = {
    update: vi.fn().mockResolvedValue({ id: 1, modoLite: "niche" }),
  }
  mockPrismaClient.featureEmpresa = {
    findFirst: vi.fn().mockResolvedValue(null),
  }
  mockPrismaClient.planMembresia = {
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 1 }),
  }
})

describe("activarNicheApp", () => {
  it("setea modoLite niche y feature con goldenPath", async () => {
    await activarNicheApp(1, "niche.consorcios")

    expect(mockPrismaClient.empresa.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { modoLite: "niche" },
    })
    expect(setFeature).toHaveBeenCalledWith(
      1,
      NICHE_FEATURE_KEY,
      expect.objectContaining({
        activado: true,
        parametros: expect.objectContaining({
          primarySku: "niche.consorcios",
          appId: "consorcios",
          goldenPath: "/dashboard/nicho/consorcios",
        }),
      }),
    )
  })

  it("crea plan membresía para engine cuotas", async () => {
    await activarNicheApp(1, "niche.club_barrio")
    expect(mockPrismaClient.planMembresia.create).toHaveBeenCalled()
  })

  it("no falla con SKU desconocido", async () => {
    await expect(activarNicheApp(1, "niche.inexistente")).resolves.toBeUndefined()
    expect(setFeature).not.toHaveBeenCalled()
  })

  it("prestamista auto-provisiona fiado y modoLite fiado", async () => {
    await activarNicheApp(1, "niche.prestamo_barrio")

    expect(mockUpsert).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ sku: "pos.fiado_barrio", activo: true }),
    )
    expect(mockFiadoProv).toHaveBeenCalledWith(1)
    expect(mockPrismaClient.empresa.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { modoLite: "fiado" },
    })
  })

  it("prestamista no duplica fiado si ya está activo", async () => {
    mockGetSub.mockResolvedValue({ sku: "pos.fiado_barrio", activo: true })
    await activarNicheApp(1, "niche.prestamo_barrio")
    expect(mockUpsert).not.toHaveBeenCalled()
    expect(mockFiadoProv).not.toHaveBeenCalled()
  })
})