import { describe, expect, it, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/config/parametrizacion-rubro", () => ({
  parametrizarEmpresa: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/comercial/industry-modules", () => ({
  setIndustryModules: vi.fn().mockResolvedValue(["ventas", "caja"]),
}))

vi.mock("@/lib/comercial/industry-demo-seeds", () => ({
  seedIndustryDemoData: vi.fn().mockResolvedValue({ clientes: 2, productos: 0 }),
}))

vi.mock("@/lib/comercial/trial-service", () => ({
  setTrialExpiresAt: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/comercial/retail-onboarding-service", () => ({
  applyRetailOnboarding: vi.fn(),
}))

vi.mock("@/lib/platform/product-lifecycle", () => ({
  activarProducto: vi.fn().mockResolvedValue(undefined),
  activarPack: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/platform/product-registry", () => ({
  getPackHorizontal: vi.fn().mockReturnValue(null),
}))

vi.mock("@/lib/platform/commercial-service", () => ({
  getActiveSubscription: vi.fn(),
}))

import { activarProducto } from "@/lib/platform/product-lifecycle"
import { getActiveSubscription } from "@/lib/platform/commercial-service"
import { provisionIndustryDemo } from "@/lib/comercial/industry-demo-service"

const mockActivarProducto = activarProducto as unknown as ReturnType<typeof vi.fn>
const mockGetSub = getActiveSubscription as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.empresa = {
    update: vi.fn().mockResolvedValue({ id: 1 }),
    findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 1, cuit: "20-demo1234-0" }),
  }
  mockPrismaClient.parametroFiscal = {
    upsert: vi.fn().mockResolvedValue({}),
  }
  mockPrismaClient.suscripcionModulo = {
    upsert: vi.fn().mockResolvedValue({}),
  }
  mockGetSub.mockImplementation(async (_empresaId: number, sku: string) => {
    if (sku === "pos.fiado_barrio" || sku === "niche.prestamo_barrio") {
      return { sku, activo: true }
    }
    return null
  })
})

describe("provisionIndustryDemo", () => {
  it("prestamista activa SKU de nicho y libreta fiado", async () => {
    const result = await provisionIndustryDemo(1, "prestamista")

    expect(result.industryId).toBe("prestamista")
    expect(result.goldenPath).toBe("/dashboard/fiado")
    expect(result.modoLite).toBe("fiado")
    expect(mockActivarProducto).toHaveBeenCalledWith(1, "niche.prestamo_barrio", "industry_demo")
    expect(result.skusActivados).toEqual(
      expect.arrayContaining(["niche.prestamo_barrio", "pos.fiado_barrio"]),
    )
    expect(mockPrismaClient.empresa.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ modoLite: "fiado" }),
      }),
    )
  })

  it("supermercado sin enganche no activa SKUs de marketplace", async () => {
    const result = await provisionIndustryDemo(1, "supermercado")

    expect(result.industryId).toBe("supermercado")
    expect(mockActivarProducto).not.toHaveBeenCalled()
    expect(result.skusActivados).toEqual([])
  })
})