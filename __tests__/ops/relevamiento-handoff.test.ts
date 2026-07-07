import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/marketplace/analyst-task-service", () => ({
  crearTareaMarketplace: vi.fn().mockResolvedValue({ id: "tarea-1" }),
}))

vi.mock("@/lib/marketplace/catalog-resolver", () => ({
  resolveSku: vi.fn().mockReturnValue({ nombre: "Claver Fiado", autoCertLevel: "SEMI_AUTO" }),
}))

vi.mock("@/lib/ops/sistema-log", () => ({
  persistSistemaLog: vi.fn().mockResolvedValue(null),
}))

vi.mock("@/lib/comercial/hybrid-provision-bridge", () => ({
  esPackPropiedad: (sku: string) => sku === "pool-propiedad",
  provisionarPoolPropiedad: vi.fn().mockResolvedValue({
    packId: "pool-propiedad",
    skus: ["niche.consorcios"],
    landingPath: "/dashboard/nicho/consorcios",
    onboardingIniciado: true,
  }),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comercialPipelineLead: { update: vi.fn() },
  },
}))

import { handoffDesdeRelevamiento } from "@/lib/ops/relevamiento-handoff-service"
import { crearTareaMarketplace } from "@/lib/marketplace/analyst-task-service"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import { provisionarPoolPropiedad } from "@/lib/comercial/hybrid-provision-bridge"

const baseRelevamiento = {
  id: 42,
  fechaVisita: new Date().toISOString(),
  negocio: "Almacén Test",
  nombreContacto: "Juan",
  direccion: null,
  localidad: "Rosario",
  rubro: "almacen",
  telefono: null,
  engancheCandidato: "pos.fiado_barrio",
  respFiado: null,
  respTiempoCobrar: null,
  respFacturaElectronica: null,
  respStockGondola: null,
  respQuienAtiende: null,
  dolorPrincipal: "fiado",
  nivelInteres: "alto",
  objecionPrincipal: null,
  demoMostrada: true,
  trialOfrecido: true,
  trialAceptado: false,
  speechUsado: null,
  proximaAccion: null,
  proximaFecha: null,
  notas: null,
  lat: null,
  lon: null,
  leadId: 7,
  leadEmpresaId: null,
  creadoPor: "vendedor@test.com",
  createdAt: new Date().toISOString(),
}

describe("relevamiento-handoff", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("crea tarea marketplace si el lead tiene empresa", async () => {
    const result = await handoffDesdeRelevamiento(baseRelevamiento, 7, 99)
    expect(result.tipo).toBe("tarea_marketplace")
    expect(crearTareaMarketplace).toHaveBeenCalledWith(
      expect.objectContaining({ empresaId: 99, sku: "pos.fiado_barrio" }),
    )
  })

  it("auto-provisiona pool-propiedad sin tarea analista", async () => {
    const rel = { ...baseRelevamiento, engancheCandidato: "pool-propiedad", rubro: "inmobiliaria" }
    const result = await handoffDesdeRelevamiento(rel, 7, 99)
    expect(provisionarPoolPropiedad).toHaveBeenCalledWith(99, "relevamiento")
    expect(crearTareaMarketplace).not.toHaveBeenCalled()
    expect(result.tipo).toBe("tarea_marketplace")
  })

  it("registra en torre si no hay empresa", async () => {
    const result = await handoffDesdeRelevamiento(baseRelevamiento, 7, null)
    expect(result.tipo).toBe("torre_log")
    expect(persistSistemaLog).toHaveBeenCalledWith(
      expect.objectContaining({ contexto: "relevamiento-handoff", empresaId: 0 }),
    )
  })
})