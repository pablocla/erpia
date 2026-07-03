import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/platform/commercial-service", () => ({
  upsertSuscripcion: vi.fn().mockResolvedValue({}),
  getActiveSubscription: vi.fn(),
}))

vi.mock("@/lib/config/rubro-config-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/config/rubro-config-service")>()
  return {
    ...actual,
    setFeature: vi.fn().mockResolvedValue(undefined),
  }
})

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/lib/fiado/fiado-provision", () => ({
  activarLibretaFiado: vi.fn().mockResolvedValue({ ok: true }),
}))

import { upsertSuscripcion, getActiveSubscription } from "@/lib/platform/commercial-service"
import { setFeature } from "@/lib/config/rubro-config-service"
import { activarLibretaFiado } from "@/lib/fiado/fiado-provision"
import { activarProducto, desactivarProducto } from "@/lib/platform/product-lifecycle"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.suscripcionModulo = {
    findMany: vi.fn().mockResolvedValue([]),
  }
})

describe("product-lifecycle", () => {
  it("activarProducto sincroniza suscripción, feature y hook fiado", async () => {
    vi.mocked(getActiveSubscription).mockResolvedValue(null)

    await activarProducto(1, "pos.fiado_barrio", "test")

    expect(upsertSuscripcion).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ sku: "pos.fiado_barrio", activo: true }),
    )
    expect(setFeature).toHaveBeenCalledWith(1, "pos.fiado_barrio", { activado: true })
    expect(activarLibretaFiado).toHaveBeenCalledWith(1)
  })

  it("desactivarProducto apaga suscripción y feature", async () => {
    await desactivarProducto(1, "pos.fiado_barrio", "test")

    expect(upsertSuscripcion).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ sku: "pos.fiado_barrio", activo: false }),
    )
    expect(setFeature).toHaveBeenCalledWith(1, "pos.fiado_barrio", { activado: false })
  })

  it("rechaza cobranzas wa sin whatsapp", async () => {
    vi.mocked(getActiveSubscription).mockResolvedValue(null)

    await expect(activarProducto(1, "intang.cobranzas_wa")).rejects.toThrow(/dependencias/i)
  })

  it("prestamista auto-provisiona fiado antes de validar dependencias", async () => {
    vi.mocked(getActiveSubscription).mockImplementation(async (_empresaId, sku) => {
      const fiadoProvisionado = vi
        .mocked(upsertSuscripcion)
        .mock.calls.some((c) => c[1]?.sku === "pos.fiado_barrio" && c[1]?.activo === true)
      if (sku === "pos.fiado_barrio" && fiadoProvisionado) {
        return { sku, activo: true } as Awaited<ReturnType<typeof getActiveSubscription>>
      }
      return null
    })

    mockPrismaClient.empresa = { update: vi.fn().mockResolvedValue({}) }
    mockPrismaClient.featureEmpresa = { findFirst: vi.fn().mockResolvedValue(null) }

    await activarProducto(1, "niche.prestamo_barrio", "test")

    expect(upsertSuscripcion).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ sku: "pos.fiado_barrio", activo: true }),
    )
    expect(upsertSuscripcion).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ sku: "niche.prestamo_barrio", activo: true }),
    )
    expect(activarLibretaFiado).toHaveBeenCalledWith(1)
  })
})