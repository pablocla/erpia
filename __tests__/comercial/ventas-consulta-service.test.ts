import { describe, it, expect, vi, beforeEach } from "vitest"
import { submitVentasConsulta } from "@/lib/comercial/ventas-consulta-service"
import { createComercialLead } from "@/lib/ops/comercial-pipeline-service"
import { notifyAnalistasFunnel } from "@/lib/comercial/comercial-funnel-service"

vi.mock("@/lib/ops/comercial-pipeline-service", () => ({
  createComercialLead: vi.fn(),
}))

vi.mock("@/lib/comercial/comercial-funnel-service", () => ({
  notifyAnalistasFunnel: vi.fn(),
}))

describe("ventas-consulta-service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createComercialLead).mockResolvedValue({
      id: 42,
      nombre: "Juan Pérez",
      negocio: "Almacén",
      telefono: "3415551234",
      email: "juan@test.com",
      localidad: null,
      rubro: "almacen",
      origen: "web",
      etapa: "prospecto",
      valorEstimado: null,
      proximaAccion: "Agendar reunión — contactar en 24 h",
      proximaFecha: null,
      notas: "[Agendar reunión]\n\nPágina: /claver/contacto",
      lat: null,
      lon: null,
      empresaId: null,
      creadoPor: "web@claver.com.ar",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  })

  it("crea lead web y notifica funnel comercial", async () => {
    const lead = await submitVentasConsulta({
      nombre: "Juan Pérez",
      email: "juan@test.com",
      tipo: "reunion",
      pagina: "/claver/contacto",
    })

    expect(lead.id).toBe(42)
    expect(notifyAnalistasFunnel).toHaveBeenCalledWith("consulta_web", expect.objectContaining({ id: 42 }))
  })

  it("rechaza honeypot", async () => {
    await expect(
      submitVentasConsulta({
        nombre: "Bot",
        email: "bot@spam.com",
        website: "http://spam.com",
      }),
    ).rejects.toThrow("Solicitud rechazada")
    expect(createComercialLead).not.toHaveBeenCalled()
  })
})