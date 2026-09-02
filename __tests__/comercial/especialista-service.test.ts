import { describe, expect, it, vi, beforeEach } from "vitest"

vi.mock("@/lib/ops/comercial-pipeline-service", () => ({
  createComercialLead: vi.fn(),
  updateComercialLead: vi.fn(),
  getComercialLeadById: vi.fn(),
}))

vi.mock("@/lib/comercial/comercial-funnel-service", () => ({
  notifyAnalistasFunnel: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comercialPipelineLead: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/config/env", () => ({
  getMpAccessToken: vi.fn(() => ""),
  isMpMockMode: vi.fn(() => true),
}))

import { createComercialLead, updateComercialLead } from "@/lib/ops/comercial-pipeline-service"
import { parseEspecialistaMeta, crearCheckoutEspecialista } from "@/lib/servicios-especialista/especialista-service"
import { ORIGEN_ESPECIALISTA } from "@/lib/servicios-especialista/especialista-catalog"

const leadBase = {
  id: 21,
  nombre: "Ana",
  negocio: "Kiosco 12",
  telefono: "1133334444",
  email: "ana@test.com",
  localidad: null,
  rubro: "svc.implementacion.express",
  origen: ORIGEN_ESPECIALISTA,
  etapa: "visita" as const,
  valorEstimado: 35000,
  proximaAccion: "Cobrar pack",
  proximaFecha: null,
  notas: "[ESPECIALISTA]\n{\"v\":1,\"packId\":\"puesta_a_punto_express\",\"sku\":\"svc.implementacion.express\",\"estadoPago\":\"pendiente\"}\nPack express",
  lat: null,
  lon: null,
  empresaId: 9,
  creadoPor: "ana@test.com",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe("especialista-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createComercialLead).mockResolvedValue(leadBase)
    vi.mocked(updateComercialLead).mockResolvedValue(leadBase)
  })

  it("parsea meta JSON del pipeline", () => {
    const meta = parseEspecialistaMeta(leadBase.notas)
    expect(meta?.packId).toBe("puesta_a_punto_express")
    expect(meta?.estadoPago).toBe("pendiente")
  })

  it("crea checkout mock sin WhatsApp como medio de pago", async () => {
    const result = await crearCheckoutEspecialista({
      empresaId: 9,
      email: "ana@test.com",
      nombre: "Ana",
      empresaNombre: "Kiosco 12",
      packId: "puesta_a_punto_express",
      telefono: "11 3333-4444",
    })
    expect(result.mock).toBe(true)
    expect(result.checkoutUrl).toContain("orden=21")
    expect(result.checkoutUrl).toContain("mp_mock=1")
    expect(createComercialLead).toHaveBeenCalledWith(
      expect.objectContaining({
        origen: ORIGEN_ESPECIALISTA,
        valorEstimado: 35000,
        empresaId: 9,
      }),
      "ana@test.com",
    )
  })

  it("rechaza pack inexistente y teléfono corto", async () => {
    await expect(
      crearCheckoutEspecialista({
        empresaId: 9,
        email: "ana@test.com",
        nombre: "Ana",
        packId: "no-existe",
        telefono: "1133334444",
      }),
    ).rejects.toThrow(/pack/i)

    await expect(
      crearCheckoutEspecialista({
        empresaId: 9,
        email: "ana@test.com",
        nombre: "Ana",
        packId: "puesta_a_punto_express",
        telefono: "123",
      }),
    ).rejects.toThrow(/whatsapp/i)
  })
})
