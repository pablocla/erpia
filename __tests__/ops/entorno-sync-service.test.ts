import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/prisma", () => ({
  prisma: new Proxy(
    { $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]) },
    {
      get(target, prop) {
        if (prop in target) return (target as Record<string | symbol, unknown>)[prop]
        return (mockPrismaClient as Record<string, unknown>)[prop as string]
      },
    },
  ),
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/ops/ops-service", () => ({
  ensureTenantEntornos: vi.fn().mockResolvedValue([
    { id: 1, codigo: "dev", metadata: {} },
    { id: 2, codigo: "val", metadata: {} },
    { id: 3, codigo: "prd", metadata: {} },
  ]),
}))

const empresaBase = {
  rubro: "comercio",
  rubroId: null,
  condicionIva: "Responsable Inscripto",
  paisFiscal: "AR",
  puntoVenta: 1,
  direccion: "Calle 1",
  telefono: null,
  email: "a@test.com",
  temaConfig: null,
  entornoAfip: "produccion",
}

describe("entorno-sync-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.tenantEntorno.findFirst.mockImplementation(
      ({ where }: { where: { codigo: string } }) =>
        Promise.resolve({
          id: where.codigo === "val" ? 2 : where.codigo === "prd" ? 3 : 1,
          codigo: where.codigo,
          metadata: {},
        }),
    )
    mockPrismaClient.tenantEntorno.update.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 2, metadata: data.metadata }),
    )
    mockPrismaClient.empresa.findUnique.mockResolvedValue(empresaBase)
    mockPrismaClient.parametroFiscal.findMany.mockResolvedValue([
      { clave: "onboarding_completado", valor: "1", descripcion: null, categoria: "operativo", pais: null, normativa: null, activo: true },
    ])
    mockPrismaClient.featureEmpresa = mockPrismaClient.featureEmpresa ?? {
      findMany: vi.fn().mockResolvedValue([
        { featureKey: "pos", activado: true, modoSimplificado: false, parametros: null, notas: null },
      ]),
    }
    mockPrismaClient.featureEmpresa.findMany.mockResolvedValue([
      { featureKey: "pos", activado: true, modoSimplificado: false, parametros: null, notas: null },
    ])
    mockPrismaClient.suscripcionModulo.findMany.mockResolvedValue([
      { sku: "core.pos", activo: true, limiteEventosMes: null, metadata: null },
    ])
    mockPrismaClient.empresa.update.mockResolvedValue({})
    mockPrismaClient.parametroFiscal.upsert.mockResolvedValue({})
    mockPrismaClient.featureEmpresa.upsert = vi.fn().mockResolvedValue({})
    mockPrismaClient.suscripcionModulo.upsert.mockResolvedValue({})
  })

  it("capturarSnapshotEntorno guarda dominios en metadata val", async () => {
    const { capturarSnapshotEntorno } = await import("@/lib/ops/entorno-sync-service")
    const snap = await capturarSnapshotEntorno(1, "val", "analista@test.com")
    expect(snap.codigo).toBe("val")
    expect(snap.data.empresa_config?.rubro).toBe("comercio")
    expect(mockPrismaClient.tenantEntorno.update).toHaveBeenCalled()
  })

  it("promoverValAPrd falla sin snapshot previo en val", async () => {
    mockPrismaClient.tenantEntorno.findFirst.mockResolvedValue({ id: 2, codigo: "val", metadata: {} })
    const { promoverValAPrd } = await import("@/lib/ops/entorno-sync-service")
    await expect(promoverValAPrd(1, "a@test.com")).rejects.toThrow(/snapshot en VAL/i)
  })

  it("promoverValAPrd aplica snapshot val a live db", async () => {
    const valSnapshot = {
      version: 1 as const,
      capturedAt: new Date().toISOString(),
      capturedBy: "a@test.com",
      codigo: "val" as const,
      dominios: ["empresa_config", "features"] as const,
      data: {
        empresa_config: { ...empresaBase, entornoAfip: "homologacion" },
        features: [{ featureKey: "pos", activado: true, modoSimplificado: false, parametros: null, notas: null }],
      },
    }
    mockPrismaClient.tenantEntorno.findFirst.mockImplementation(
      ({ where }: { where: { codigo: string } }) =>
        Promise.resolve({
          id: 2,
          codigo: where.codigo,
          metadata:
            where.codigo === "val"
              ? { configSnapshot: valSnapshot }
              : {},
        }),
    )

    const { promoverValAPrd } = await import("@/lib/ops/entorno-sync-service")
    const result = await promoverValAPrd(1, "analista@test.com")
    expect(result.direccion).toBe("val→prd")
    expect(result.aplicadoALiveDb).toBe(true)
    expect(mockPrismaClient.empresa.update).toHaveBeenCalled()
    expect(mockPrismaClient.featureEmpresa.upsert).toHaveBeenCalled()
  })

  it("refrescarValDesdePrd no aplica a live db y sanitiza AFIP en val", async () => {
    const { refrescarValDesdePrd } = await import("@/lib/ops/entorno-sync-service")
    const result = await refrescarValDesdePrd(1, "analista@test.com")
    expect(result.direccion).toBe("prd→val")
    expect(result.aplicadoALiveDb).toBe(false)
    expect(mockPrismaClient.empresa.update).not.toHaveBeenCalled()
    const updateCall = mockPrismaClient.tenantEntorno.update.mock.calls.at(-1)?.[0] as {
      data: { metadata: { configSnapshot: { data: { empresa_config: { entornoAfip: string } } } } }
    }
    expect(updateCall?.data?.metadata?.configSnapshot?.data?.empresa_config?.entornoAfip).toBe("homologacion")
  })

  it("actualizarConfigEnVal mergea patch sin tocar empresa.update", async () => {
    const { actualizarConfigEnVal } = await import("@/lib/ops/entorno-sync-service")
    const snap = await actualizarConfigEnVal(
      1,
      { empresa_config: { rubro: "gastronomia", rubroId: null, condicionIva: "Monotributista", paisFiscal: "AR", puntoVenta: 2, direccion: null, telefono: null, email: null, temaConfig: null, entornoAfip: "homologacion" } },
      "analista@test.com",
    )
    expect(snap.data.empresa_config?.rubro).toBe("gastronomia")
    expect(mockPrismaClient.empresa.update).not.toHaveBeenCalled()
  })

  it("getEntornoSyncStatus detecta val sin snapshot", async () => {
    const { getEntornoSyncStatus } = await import("@/lib/ops/entorno-sync-service")
    const status = await getEntornoSyncStatus(1)
    expect(status.puedeRefrescarValDesdePrd).toBe(true)
    expect(status.mensaje).toMatch(/VAL sin snapshot/i)
  })
})