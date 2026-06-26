import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/platform/commercial-service", () => ({
  upsertSuscripcion: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/marketplace/analyst-task-service", () => ({
  crearTareaMarketplace: vi.fn().mockResolvedValue({ id: "tarea-1", asignadoA: "analista@test.com" }),
  resolverAnalistaEmpresa: vi.fn().mockResolvedValue("analista@test.com"),
}))

vi.mock("@/lib/platform/product-lifecycle", () => ({
  activarProducto: vi.fn().mockResolvedValue({ ok: true }),
}))

import { upsertSuscripcion } from "@/lib/platform/commercial-service"
import { crearTareaMarketplace } from "@/lib/marketplace/analyst-task-service"
import { activarProducto } from "@/lib/platform/product-lifecycle"
import { provisionSku } from "@/lib/marketplace/provision-service"

beforeEach(() => {
  vi.clearAllMocks()
  mockPrismaClient.marketplaceProvisionJob = {
    create: vi.fn().mockResolvedValue({
      id: "job-1",
      metadata: {},
      createdAt: new Date(),
      pasosJson: [],
    }),
    update: vi.fn().mockResolvedValue({}),
    findUnique: vi.fn().mockResolvedValue({
      id: "job-1",
      pasosJson: [{ orden: 1, titulo: "Test", done: false }],
      createdAt: new Date(),
    }),
  }
})

describe("provisionSku", () => {
  it("activa suscripción automáticamente para GLOBAL_AUTO", async () => {
    const result = await provisionSku(1, "sec.backup")

    expect(result.auto).toBe(true)
    expect(result.jobId).toBe("job-1")
    expect(activarProducto).toHaveBeenCalledWith(1, "sec.backup", "marketplace_auto")
    expect(crearTareaMarketplace).not.toHaveBeenCalled()
  })

  it("crea tarea analista para SEMI_AUTO", async () => {
    const result = await provisionSku(1, "integ.shopify")

    expect(result.auto).toBe(false)
    expect(crearTareaMarketplace).toHaveBeenCalledWith(
      expect.objectContaining({ sku: "integ.shopify", empresaId: 1 }),
    )
    expect(upsertSuscripcion).not.toHaveBeenCalled()
  })

  it("Mercado Libre SEMI_AUTO: pago cliente → tarea analista sin activar SKU", async () => {
    const result = await provisionSku(1, "integ.mercado_libre", { iniciadoPor: "checkout" })

    expect(result.auto).toBe(false)
    expect(result.nombre).toContain("Mercado Libre")
    expect(crearTareaMarketplace).toHaveBeenCalledWith(
      expect.objectContaining({ sku: "integ.mercado_libre", autoCertLevel: "SEMI_AUTO" }),
    )
    expect(activarProducto).not.toHaveBeenCalled()
  })

  it("activa producto al provisionar intang.cobranzas_wa", async () => {
    await provisionSku(1, "intang.cobranzas_wa")
    expect(activarProducto).toHaveBeenCalledWith(1, "intang.cobranzas_wa", "marketplace_auto")
  })

  it("activa producto horizontal al provisionar pos.fiado_barrio", async () => {
    await provisionSku(1, "pos.fiado_barrio")
    expect(activarProducto).toHaveBeenCalledWith(1, "pos.fiado_barrio", "marketplace_auto")
  })

  it("falla si SKU no existe", async () => {
    await expect(provisionSku(1, "sku.inexistente")).rejects.toThrow("SKU no encontrado")
  })
})