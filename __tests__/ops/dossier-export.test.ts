import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/ops/implementacion-service", () => ({
  getProyectoImplementacion: vi.fn(),
}))

vi.mock("@/lib/ops/readiness-service", () => ({
  getEmpresaReadiness: vi.fn().mockResolvedValue({
    empresaId: 5,
    listoGoLive: false,
    score: 65,
    items: [],
    rubroChecks: [],
  }),
}))

import { getProyectoImplementacion } from "@/lib/ops/implementacion-service"
import { exportDossierJson } from "@/lib/ops/dossier-export"
import { buildFasesIniciales } from "@/lib/ops/implementacion-types"

describe("dossier-export", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getProyectoImplementacion).mockResolvedValue({
      id: 1,
      codigo: "IMP-2026-00005",
      estado: "activo",
      faseActual: "CCA-040",
      porcentajeAvance: 25,
      planComercial: "Pro",
      analistaEmail: "analista@claver.com",
      fechaVenta: new Date("2026-01-01"),
      fechaKickoff: null,
      fechaObjetivoGoLive: new Date("2026-03-01"),
      fechaGoLiveReal: null,
      fases: buildFasesIniciales(),
      packOnboardEntregado: false,
      urlAcceso: "https://app.claver.cloud",
      notas: null,
      empresaId: 5,
      empresa: { id: 5, nombre: "Test SA", razonSocial: "Test SA", rubro: "comercio" },
    } as never)

    mockPrismaClient.actaImplementacion.findMany.mockResolvedValue([
      { id: 1, tipo: "kickoff", titulo: "Kick-off", createdAt: new Date() },
    ])
    mockPrismaClient.analistaAsignacion.findMany.mockResolvedValue([
      { analistaEmail: "analista@claver.com", rolAsignacion: "lead" },
    ])
    mockPrismaClient.tenantEntorno.findMany.mockResolvedValue([
      { codigo: "prd", estado: "activo", urlBase: "https://app.claver.cloud", version: "abc" },
    ])
  })

  it("exports dossier with expected format", async () => {
    const dossier = await exportDossierJson(1)
    expect(dossier).not.toBeNull()
    expect(dossier!.formato).toBe("claver-cloud-dossier-v1")
    expect(dossier!.proyecto.codigo).toBe("IMP-2026-00005")
    expect(dossier!.actas).toHaveLength(1)
    expect(dossier!.readiness.score).toBe(65)
    expect(dossier!.analistas[0].email).toBe("analista@claver.com")
  })

  it("returns null when project not found", async () => {
    vi.mocked(getProyectoImplementacion).mockResolvedValue(null)
    const dossier = await exportDossierJson(99)
    expect(dossier).toBeNull()
  })
})