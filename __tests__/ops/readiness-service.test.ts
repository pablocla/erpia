import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/ops/implementacion-service", () => ({
  getProyectoPorEmpresa: vi.fn(),
}))

import { getProyectoPorEmpresa } from "@/lib/ops/implementacion-service"
import { getEmpresaReadiness } from "@/lib/ops/readiness-service"
import { buildFasesIniciales } from "@/lib/ops/implementacion-types"

describe("readiness-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.empresa.findUnique.mockResolvedValue({
      cuit: "20-12345678-9",
      rubro: "comercio",
      entornoAfip: "produccion",
      certificadoCRT: "-----BEGIN CERT-----",
      planHosting: "shared",
    })
    mockPrismaClient.usuario.count.mockResolvedValue(2)
    mockPrismaClient.producto.count.mockResolvedValue(10)
    mockPrismaClient.cliente.count.mockResolvedValue(3)
    mockPrismaClient.parametroFiscal.findFirst.mockResolvedValue({ valor: "1" })
    mockPrismaClient.tenantEntorno.count.mockResolvedValue(3)

    const fases = buildFasesIniciales()
    fases["CCA-060"] = { completado: true, fecha: new Date().toISOString() }
    vi.mocked(getProyectoPorEmpresa).mockResolvedValue({
      id: 1,
      codigo: "IMP-2026-00001",
      packOnboardEntregado: true,
      fases,
    } as never)
  })

  it("returns ready when all critical checks pass", async () => {
    const report = await getEmpresaReadiness(1)
    expect(report.empresaId).toBe(1)
    expect(report.listoGoLive).toBe(true)
    expect(report.score).toBeGreaterThan(80)
    expect(report.items.some((i) => i.id === "cuit" && i.estado === "ok")).toBe(true)
    expect(report.rubroChecks.some((i) => i.id === "maestro_productos")).toBe(true)
  })

  it("flags demo CUIT and missing project as fail", async () => {
    mockPrismaClient.empresa.findUnique.mockResolvedValue({
      cuit: "DEMO-123",
      rubro: "comercio",
      entornoAfip: "homologacion",
      certificadoCRT: null,
      planHosting: "shared",
    })
    mockPrismaClient.usuario.count.mockResolvedValue(0)
    mockPrismaClient.producto.count.mockResolvedValue(0)
    vi.mocked(getProyectoPorEmpresa).mockResolvedValue(null)

    const report = await getEmpresaReadiness(2)
    expect(report.listoGoLive).toBe(false)
    expect(report.items.find((i) => i.id === "cuit")?.estado).toBe("fail")
    expect(report.items.find((i) => i.id === "proyecto_cca")?.estado).toBe("fail")
  })
})