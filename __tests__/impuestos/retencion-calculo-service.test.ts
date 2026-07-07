import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  calcularRetencionesPago,
  calcularRetencionesCobroSufridas,
} from "@/lib/impuestos/retencion-calculo-service"
import { prisma } from "@/lib/prisma"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    configFiscalEmpresa: { findUnique: vi.fn() },
    proveedor: { findFirst: vi.fn() },
    cliente: { findFirst: vi.fn() },
    regimenRetencion: { findFirst: vi.fn() },
    retencionSICORE: { findMany: vi.fn() },
  },
}))

describe("RetencionCalculoService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.regimenRetencion.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.retencionSICORE.findMany).mockResolvedValue([])
  })

  describe("calcularRetencionesPago", () => {
    it("retorna vacío si no hay config fiscal", async () => {
      vi.mocked(prisma.configFiscalEmpresa.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.proveedor.findFirst).mockResolvedValue({ condicionIva: "Responsable Inscripto" } as never)

      const res = await calcularRetencionesPago({
        empresaId: 1,
        proveedorId: 10,
        montoBase: 500000,
      })

      expect(res.aplicadas).toBe(false)
      expect(res.total).toBe(0)
      expect(res.detalle).toHaveLength(0)
    })

    it("retorna vacío si proveedor tiene certificado de exclusión vigente", async () => {
      vi.mocked(prisma.configFiscalEmpresa.findUnique).mockResolvedValue({
        esAgenteRetencionIVA: true,
        esAgenteRetencionGanancias: true,
        esAgenteRetencionIIBB: true,
      } as never)
      vi.mocked(prisma.proveedor.findFirst).mockResolvedValue({
        condicionIva: "Responsable Inscripto",
        nroCertificadoExclusion: "EX-001",
        vigenciaCertificadoExclusion: new Date("2099-12-31"),
      } as never)

      const res = await calcularRetencionesPago({
        empresaId: 1,
        proveedorId: 10,
        montoBase: 500000,
      })

      expect(res.aplicadas).toBe(false)
      expect(res.total).toBe(0)
    })

    it("calcula IVA, Ganancias e IIBB cuando somos agente de retención", async () => {
      vi.mocked(prisma.configFiscalEmpresa.findUnique).mockResolvedValue({
        esAgenteRetencionIVA: true,
        esAgenteRetencionGanancias: true,
        esAgenteRetencionIIBB: true,
      } as never)
      vi.mocked(prisma.proveedor.findFirst).mockResolvedValue({
        condicionIva: "Responsable Inscripto",
        nroCertificadoExclusion: null,
        vigenciaCertificadoExclusion: null,
      } as never)

      const res = await calcularRetencionesPago({
        empresaId: 1,
        proveedorId: 10,
        montoBase: 500000,
        jurisdiccion: "PBA",
      })

      expect(res.aplicadas).toBe(true)
      expect(res.retencionIVA).toBeGreaterThan(0)
      expect(res.retencionGanancias).toBeGreaterThan(0)
      expect(res.retencionIIBB).toBeGreaterThan(0)
      expect(res.total).toBe(res.retencionIVA + res.retencionGanancias + res.retencionIIBB)
      expect(res.detalle).toHaveLength(3)
    })

    it("no calcula IVA si proveedor no es RI", async () => {
      vi.mocked(prisma.configFiscalEmpresa.findUnique).mockResolvedValue({
        esAgenteRetencionIVA: true,
        esAgenteRetencionGanancias: false,
        esAgenteRetencionIIBB: false,
      } as never)
      vi.mocked(prisma.proveedor.findFirst).mockResolvedValue({
        condicionIva: "Monotributista",
        nroCertificadoExclusion: null,
        vigenciaCertificadoExclusion: null,
      } as never)

      const res = await calcularRetencionesPago({
        empresaId: 1,
        proveedorId: 10,
        montoBase: 500000,
      })

      expect(res.retencionIVA).toBe(0)
      expect(res.aplicadas).toBe(false)
    })
  })

  describe("calcularRetencionesCobroSufridas", () => {
    it("retorna vacío si cliente no existe", async () => {
      vi.mocked(prisma.cliente.findFirst).mockResolvedValue(null)

      const res = await calcularRetencionesCobroSufridas({
        empresaId: 1,
        clienteId: 5,
        montoBase: 300000,
      })

      expect(res.aplicadas).toBe(false)
      expect(res.total).toBe(0)
    })

    it("calcula retención IVA cuando cliente es agente", async () => {
      vi.mocked(prisma.cliente.findFirst).mockResolvedValue({
        esAgenteRetencionIVA: true,
        esAgenteRetencionGanancias: false,
        condicionIva: "Responsable Inscripto",
        nroCertificadoExclusion: null,
        vigenciaCertificadoExclusion: null,
      } as never)

      const res = await calcularRetencionesCobroSufridas({
        empresaId: 1,
        clienteId: 5,
        montoBase: 300000,
      })

      expect(res.aplicadas).toBe(true)
      expect(res.retencionIVA).toBeGreaterThan(0)
      expect(res.detalle[0].tipo).toBe("IVA")
    })

    it("calcula ganancias cuando cliente es agente de ganancias", async () => {
      vi.mocked(prisma.cliente.findFirst).mockResolvedValue({
        esAgenteRetencionIVA: false,
        esAgenteRetencionGanancias: true,
        condicionIva: "Responsable Inscripto",
        nroCertificadoExclusion: null,
        vigenciaCertificadoExclusion: null,
      } as never)

      const res = await calcularRetencionesCobroSufridas({
        empresaId: 1,
        clienteId: 5,
        montoBase: 300000,
      })

      expect(res.aplicadas).toBe(true)
      expect(res.retencionGanancias).toBeGreaterThan(0)
    })
  })
})