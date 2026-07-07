import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

vi.mock("@/lib/consorcios/consorcios-morosos-service", () => ({
  listarMorososExpensas: vi.fn().mockResolvedValue([]),
}))

vi.mock("@/lib/comercial/propiedad-onboarding", () => ({
  PROPIEDAD_ONBOARDING_STEPS: [
    { id: "abrir_consorcios", label: "Consorcios", href: "/dashboard/nicho/consorcios" },
    { id: "liquidar_pdf", label: "PDF", href: "/dashboard/nicho/consorcios" },
    { id: "primer_wa", label: "WA", href: "/dashboard/nicho/consorcios" },
    { id: "ver_cartera", label: "Cartera", href: "/dashboard/nicho/inmobiliaria" },
  ],
  obtenerOnboardingPropiedad: vi.fn().mockResolvedValue({
    origen: "test",
    iniciadoAt: new Date().toISOString(),
    completados: ["abrir_consorcios"],
    dismissed: false,
  }),
  onboardingPropiedadPendiente: vi.fn().mockReturnValue(true),
}))

import { listarMorososExpensas } from "@/lib/consorcios/consorcios-morosos-service"
import {
  esTenantPropiedad,
  getTenantPropiedadOverview,
  getPropiedadFleetKpis,
} from "@/lib/ops/tenant-propiedad-service"

describe("tenant-propiedad-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrismaClient.empresa.findUnique.mockResolvedValue({ rubro: "inmobiliaria" })
    mockPrismaClient.suscripcionModulo.findMany.mockResolvedValue([
      { sku: "niche.consorcios" },
      { sku: "niche.inmo_garantia" },
    ])
    mockPrismaClient.consorcio.findMany.mockResolvedValue([
      {
        id: 1,
        nombre: "Edificio Demo",
        direccion: "Calle 123",
        _count: { unidades: 2 },
        unidades: [{ expensas: [{ periodo: "2026-06" }] }, { expensas: [] }],
      },
    ])
    mockPrismaClient.consorcioGasto.count.mockResolvedValue(0)
    mockPrismaClient.propiedad.count.mockResolvedValue(3)
    mockPrismaClient.contratoAlquiler.count.mockResolvedValue(2)
    mockPrismaClient.empresa.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }])
  })

  it("esTenantPropiedad detecta rubro inmobiliaria", async () => {
    expect(await esTenantPropiedad(1)).toBe(true)
  })

  it("esTenantPropiedad detecta SKUs del pack", async () => {
    mockPrismaClient.empresa.findUnique.mockResolvedValue({ rubro: "almacen" })
    mockPrismaClient.suscripcionModulo.findMany.mockResolvedValue([{ sku: "niche.consorcios" }])
    expect(await esTenantPropiedad(2)).toBe(true)
  })

  it("getTenantPropiedadOverview arma resumen operativo", async () => {
    const overview = await getTenantPropiedadOverview(1)
    expect(overview.esPropiedad).toBe(true)
    expect(overview.consorcios).toHaveLength(1)
    expect(overview.inmobiliaria.propiedades).toBe(3)
    expect(overview.onboarding.completados).toBe(1)
    expect(listarMorososExpensas).toHaveBeenCalledWith(1)
  })

  it("getPropiedadFleetKpis cuenta tenants propiedad", async () => {
    const kpis = await getPropiedadFleetKpis([1, 2])
    expect(kpis.tenantsPropiedad).toBe(2)
  })
})