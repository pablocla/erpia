import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    {},
    {
      get(_t, prop) {
        return (mockPrismaClient as Record<string, unknown>)[prop as string]
      },
    },
  ),
}))

vi.mock("@/lib/ops/readiness-service", () => ({
  getEmpresaReadiness: vi.fn().mockResolvedValue({
    empresaId: 1,
    listoGoLive: false,
    score: 65,
    items: [],
    rubroChecks: [],
    integraciones: [],
  }),
}))

vi.mock("@/lib/ops/tenant-plan-service", () => ({
  getTenantPlan: vi.fn().mockResolvedValue({
    id: "Pro",
    maxSkusActivos: 25,
    superAdminPanel: true,
    playbooksAuto: true,
    impersonacionErp: true,
    playbooksCustom: false,
    precioBaseArs: 79_900,
  }),
  validarLimiteActivacion: vi.fn().mockResolvedValue({
    id: "Pro",
    maxSkusActivos: 25,
  }),
}))

vi.mock("@/lib/ops/tenant-billing-service", () => ({
  getTenantBilling: vi.fn().mockResolvedValue({
    empresaId: 1,
    nombre: "Almacén Test",
    plan: "Pro",
    mrrSkusArs: 12_000,
    mrrPlanArs: 79_900,
    mrrTotalArs: 91_900,
    skusActivos: 1,
    limiteSkus: 25,
    opsSuperAdmin: false,
  }),
}))

vi.mock("@/lib/ops/implementacion-service", () => ({
  getProyectoPorEmpresa: vi.fn().mockResolvedValue({
    id: 10,
    codigo: "CCA-2026-001",
    faseActual: "CCA-040",
    porcentajeAvance: 42,
  }),
}))

vi.mock("@/lib/platform/product-lifecycle", () => ({
  obtenerEstadoProductos: vi.fn().mockResolvedValue({ productos: [], mapa: {}, packs: [] }),
  activarProducto: vi.fn().mockResolvedValue({ ok: true }),
  desactivarProducto: vi.fn().mockResolvedValue({ ok: true }),
  activarPack: vi.fn().mockResolvedValue({ packId: "pool-test" }),
  desactivarPack: vi.fn().mockResolvedValue({ packId: "pool-test" }),
}))

vi.mock("@/lib/marketplace/provision-service", () => ({
  provisionSku: vi.fn().mockResolvedValue({ jobId: "j1", auto: true, sku: "sec.backup" }),
}))

describe("tenant-admin-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.empresa.findUnique.mockResolvedValue({
      id: 1,
      nombre: "Almacén Test",
      razonSocial: "Test SA",
      cuit: "30-12345678-9",
      rubro: "almacen",
      entornoAfip: "homologacion",
      planHosting: "shared",
    })
    mockPrismaClient.marketplaceTareaAnalista.count.mockResolvedValue(2)
    mockPrismaClient.suscripcionModulo.findMany.mockResolvedValue([
      { sku: "sec.backup", activo: true },
    ])
  })

  it("getTenantOverview arma catálogo con estado de suscripción", async () => {
    const { getTenantOverview } = await import("@/lib/ops/tenant-admin-service")
    const overview = await getTenantOverview(1)
    expect(overview.empresa.nombre).toBe("Almacén Test")
    expect(overview.productosActivos).toBeGreaterThanOrEqual(1)
    expect(overview.productos.some((p) => p.sku === "sec.backup" && p.activo)).toBe(true)
    expect(overview.readiness.score).toBe(65)
  })

  it("ejecutarAccionProductoTenant provisiona SKU", async () => {
    const { provisionSku } = await import("@/lib/marketplace/provision-service")
    const { ejecutarAccionProductoTenant } = await import("@/lib/ops/tenant-admin-service")
    await ejecutarAccionProductoTenant(1, { action: "provision", sku: "sec.backup" }, "a@claver.com")
    expect(provisionSku).toHaveBeenCalledWith(1, "sec.backup", expect.objectContaining({ iniciadoPor: expect.stringContaining("a@claver.com") }))
  })

  it("ejecutarAccionProductoTenant activa directo", async () => {
    const { activarProducto } = await import("@/lib/platform/product-lifecycle")
    const { ejecutarAccionProductoTenant } = await import("@/lib/ops/tenant-admin-service")
    await ejecutarAccionProductoTenant(1, { action: "activate", sku: "pos.fiado_barrio" }, "a@claver.com")
    expect(activarProducto).toHaveBeenCalledWith(1, "pos.fiado_barrio", expect.stringContaining("claver_cloud"))
  })
})