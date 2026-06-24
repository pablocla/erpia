import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/ops/ops-service", () => ({
  ensureTenantEntornos: vi.fn().mockResolvedValue([
    { codigo: "prd", urlBase: "https://app.claver.cloud", estado: "activo", version: "abc1234" },
    { codigo: "val", urlBase: "https://val.app.claver.cloud", estado: "activo", version: "abc1234" },
    { codigo: "dev", urlBase: "https://dev.app.claver.cloud", estado: "activo", version: "abc1234" },
  ]),
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(undefined),
}))

import {
  buildFasesIniciales,
  calcularPorcentajeAvance,
  resolverFaseActual,
  generarCodigoProyecto,
} from "@/lib/ops/implementacion-types"
import {
  crearProyectoImplementacion,
  marcarFaseImplementacion,
  ensureProyectoImplementacion,
  crearActaImplementacion,
  getResumenImplementacionFlota,
} from "@/lib/ops/implementacion-service"

describe("implementacion-types", () => {
  it("calculates progress from completed phases", () => {
    const fases = buildFasesIniciales()
    fases["CCA-010"] = { completado: true }
    fases["CCA-020"] = { completado: true }
    expect(calcularPorcentajeAvance(fases)).toBe(10)
    expect(resolverFaseActual(fases)).toBe("CCA-030")
  })

  it("generates project code", () => {
    expect(generarCodigoProyecto(42)).toBe(`IMP-${new Date().getFullYear()}-00042`)
  })
})

describe("implementacion-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.proyectoImplementacion.findUnique.mockResolvedValue(null)
    mockPrismaClient.proyectoImplementacion.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 1, ...data, empresa: { id: 5, nombre: "Test", razonSocial: "Test SA", rubro: "comercio" } }),
    )
    mockPrismaClient.proyectoImplementacion.findUnique.mockImplementation(
      ({ where }: { where: { id?: number; empresaId?: number } }) => {
        if (where.empresaId === 5) return Promise.resolve(null)
        if (where.id === 1) {
          return Promise.resolve({
            id: 1,
            empresaId: 5,
            fases: buildFasesIniciales(),
            codigo: "IMP-2026-00005",
          })
        }
        return Promise.resolve(null)
      },
    )
    mockPrismaClient.proyectoImplementacion.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: 1,
          empresaId: 5,
          ...data,
          empresa: { id: 5, nombre: "Test", razonSocial: "Test SA", rubro: "comercio" },
        }),
    )
    mockPrismaClient.tenantEntorno.count.mockResolvedValue(3)
    mockPrismaClient.parametroFiscal.findFirst.mockResolvedValue(null)
    mockPrismaClient.empresa.findUnique.mockResolvedValue({ entornoAfip: "homologacion" })
  })

  it("creates project with CCA-010 done and url from prd entorno", async () => {
    const proyecto = await crearProyectoImplementacion({
      empresaId: 5,
      analistaEmail: "analista@claver.com",
      planComercial: "Pro",
    })
    expect(proyecto.codigo).toContain("IMP-")
    expect(proyecto.faseActual).toBe("CCA-020")
    expect(proyecto.urlAcceso).toBe("https://app.claver.cloud")
    expect(mockPrismaClient.proyectoImplementacion.create).toHaveBeenCalled()
  })

  it("marks phase and updates progress", async () => {
    const fases = buildFasesIniciales()
    fases["CCA-010"] = { completado: true }
    mockPrismaClient.proyectoImplementacion.findUnique.mockResolvedValue({
      id: 1,
      empresaId: 5,
      fases,
    })

    const updated = await marcarFaseImplementacion(
      1,
      "CCA-030",
      { completado: true, notas: "Pack entregado" },
      "analista@claver.com",
    )

    expect(updated.packOnboardEntregado).toBe(true)
    expect(mockPrismaClient.proyectoImplementacion.update).toHaveBeenCalled()
  })

  it("ensureProyectoImplementacion returns existing without creating", async () => {
    const existente = { id: 9, empresaId: 5, codigo: "IMP-2026-00005" }
    mockPrismaClient.proyectoImplementacion.findUnique.mockResolvedValue(existente)

    const result = await ensureProyectoImplementacion({ empresaId: 5 })
    expect(result).toEqual(existente)
    expect(mockPrismaClient.proyectoImplementacion.create).not.toHaveBeenCalled()
  })

  it("creates acta and logs sistema event", async () => {
    mockPrismaClient.actaImplementacion.create.mockResolvedValue({
      id: 1,
      tipo: "uat",
      titulo: "UAT aprobada",
    })
    mockPrismaClient.proyectoImplementacion.findUnique.mockResolvedValue({ empresaId: 5 })

    const acta = await crearActaImplementacion({
      proyectoId: 1,
      tipo: "uat",
      titulo: "UAT aprobada",
      firmadoPor: "analista@claver.com",
    })

    expect(acta.titulo).toBe("UAT aprobada")
    expect(mockPrismaClient.actaImplementacion.create).toHaveBeenCalled()
  })

  it("getResumenImplementacionFlota marks delayed projects", async () => {
    const fases = buildFasesIniciales()
    mockPrismaClient.proyectoImplementacion.findUnique.mockResolvedValue({
      id: 1,
      codigo: "IMP-2026-00005",
      faseActual: "CCA-040",
      porcentajeAvance: 20,
      packOnboardEntregado: false,
      fechaObjetivoGoLive: new Date("2020-01-01"),
      estado: "activo",
      fases,
    })

    const resumen = await getResumenImplementacionFlota(5)
    expect(resumen).not.toBeNull()
    expect(resumen!.atrasado).toBe(true)
    expect(resumen!.porcentajeAvance).toBeGreaterThanOrEqual(0)
  })
})