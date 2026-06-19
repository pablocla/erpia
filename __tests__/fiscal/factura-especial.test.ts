import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"

// Hoist mock functions
const { mockAuthenticate, mockConsultarUltimoComprobante } = vi.hoisted(() => ({
  mockAuthenticate: vi.fn().mockResolvedValue({ token: "mockToken", sign: "mockSign" }),
  mockConsultarUltimoComprobante: vi.fn().mockResolvedValue(100),
}))

// Mock the soap client
vi.mock("@/lib/afip/soap-client", () => {
  return {
    AFIPSoapClient: class {
      authenticate = mockAuthenticate
      consultarUltimoComprobante = mockConsultarUltimoComprobante
      emitirComprobante = vi.fn().mockResolvedValue({
        FeDetResp: {
          FECAEDetResponse: {
            Resultado: "A",
            CAE: "MOCK-CAE-123",
            CAEFchVto: "20261231",
          }
        }
      })
    }
  }
})

vi.mock("@/lib/config/rubro-config-service", () => ({
  isFeatureActiva: vi.fn().mockResolvedValue(true),
}))

import { FacturaService } from "@/lib/afip/factura-service"

describe("FacturaService - Regímenes Especiales de Facturación", () => {
  let service: FacturaService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new FacturaService("homologacion")

    // Mock initial config setups
    mockPrismaClient.empresa.findUnique.mockResolvedValue({
      id: 1,
      cuit: "30-12345678-9",
      certificadoCRT: "crt",
      certificadoKEY: "key",
    })

    mockPrismaClient.parametroFiscal.findFirst.mockResolvedValue(null) // default fallbacks will apply
    mockPrismaClient.factura.findFirst.mockResolvedValue(null) // no idempotency hit
    mockPrismaClient.factura.create.mockResolvedValue({
      id: 99,
      numero: 101,
      cae: "MOCK-CAE-123",
      fechaCAE: new Date(),
      vencimientoCAE: new Date(),
    })
    mockPrismaClient.serie.findFirst.mockResolvedValue(null) // default PV fallback

    // Mock configFiscalEmpresa for FCE CBU validation
    mockPrismaClient.configFiscalEmpresa.findUnique.mockResolvedValue({
      empresaId: 1,
      cbuFce: "0000003100010000000000",
      tipoTransferenciaFce: "SCA",
    })
  })

  it("debe facturar con tipo comprobante normal si no se superan los umbrales de FCE", async () => {
    // Mock cliente.findFirst para Gran Cliente (No supera umbral)
    mockPrismaClient.cliente.findFirst.mockResolvedValue({
      id: 10,
      nombre: "Gran Cliente SA",
      esGranEmpresa: true,
      esExportacion: false,
      condicionIva: "RESPONSABLE_INSCRIPTO",
    })

    const payload = {
      cuit: "30-12345678-9",
      puntoVenta: 1,
      tipoCbte: 1, // Factura A
      cliente: {
        nombre: "Gran Cliente SA",
        cuit: "30-99999999-9",
        condicionIva: "RESPONSABLE_INSCRIPTO",
      },
      items: [
        { descripcion: "Servicio Normal", cantidad: 1, precioUnitario: 100000, iva: 21 },
      ],
      total: 121000, // Total $121.000 (Menor a umbral de 5.4M)
    }

    const res = await service.emitirFactura(payload)
    expect(res.error).toBeUndefined()
    expect(res.success).toBe(true)

    // Verificamos que se consulte el último comprobante para el tipoCbte normal 1
    expect(mockConsultarUltimoComprobante).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      1, // puntoVenta
      1, // tipoCbte normal A
    )
  })

  it("debe ruteo automático a FCE (tipoCbte 201) si cliente es Gran Empresa y total >= umbral", async () => {
    mockPrismaClient.cliente.findFirst.mockResolvedValue({
      id: 10,
      nombre: "Gran Cliente SA",
      esGranEmpresa: true,
      esExportacion: false,
      condicionIva: "RESPONSABLE_INSCRIPTO",
    })

    const payload = {
      cuit: "30-12345678-9",
      puntoVenta: 1,
      tipoCbte: 1, // Factura A original
      cliente: {
        nombre: "Gran Cliente SA",
        cuit: "30-99999999-9",
        condicionIva: "RESPONSABLE_INSCRIPTO",
      },
      items: [
        { descripcion: "Venta de Maquinaria Pesada", cantidad: 1, precioUnitario: 6000000, iva: 21 },
      ],
      total: 7260000, // Total $7.26M >= Umbral 5.4M
    }

    const res = await service.emitirFactura(payload)
    expect(res.error).toBeUndefined()
    expect(res.success).toBe(true)
    
    // Debe haber consultado el último comprobante para 201 (FCE MiPyME A)
    expect(mockConsultarUltimoComprobante).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      1, // puntoVenta
      201, // FCE MiPyME A
    )
  })

  it("debe ruteo automático a Factura de Exportación E (tipoCbte 19) si cliente es de Exportación", async () => {
    mockPrismaClient.cliente.findFirst.mockResolvedValue({
      id: 11,
      nombre: "Foreign Client LLC",
      esGranEmpresa: false,
      esExportacion: true,
      condicionIva: "EXENTO",
    })

    const payload = {
      cuit: "30-12345678-9",
      puntoVenta: 1,
      tipoCbte: 1, // Factura A original
      cliente: {
        nombre: "Foreign Client LLC",
        cuit: "55-55555555-5",
        condicionIva: "EXENTO",
      },
      items: [
        { descripcion: "Exportación de Software", cantidad: 1, precioUnitario: 5000, iva: 0, exento: true },
      ],
      total: 5000,
    }

    const res = await service.emitirFactura(payload)
    expect(res.error).toBeUndefined()
    expect(res.success).toBe(true)
    
    // Debe haber consultado el último comprobante para 19 (Factura E de Exportación)
    expect(mockConsultarUltimoComprobante).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      1,
      19,
    )
  })

  it("debe resolver dinámicamente el punto de venta utilizando la tabla de Series si está configurado", async () => {
    mockPrismaClient.cliente.findFirst.mockResolvedValue({
      id: 11,
      nombre: "Foreign Client LLC",
      esGranEmpresa: false,
      esExportacion: true,
      condicionIva: "EXENTO",
    })

    // Mockear que existe una Serie configurada para Factura E (tipoCbte 19) apuntando al Punto de Venta #8
    mockPrismaClient.serie.findFirst.mockResolvedValue({
      id: 2,
      prefijo: "E",
      puntoVenta: {
        id: 4,
        numero: 8, // Punto de Venta Especial para Exportación
        activo: true,
      },
    })

    const payload = {
      cuit: "30-12345678-9",
      puntoVenta: 1,
      tipoCbte: 1,
      cliente: {
        nombre: "Foreign Client LLC",
        cuit: "55-55555555-5",
        condicionIva: "EXENTO",
      },
      items: [
        { descripcion: "Exportación de Bienes", cantidad: 1, precioUnitario: 10000, iva: 0, exento: true },
      ],
      total: 10000,
    }

    const res = await service.emitirFactura(payload)
    expect(res.error).toBeUndefined()
    expect(res.success).toBe(true)
    
    // Debe consultar con el punto de venta configurado en la Serie (8) en lugar del original (1)
    expect(mockConsultarUltimoComprobante).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      8, // puntoVenta resuelto por Serie
      19, // tipoCbte de exportación
    )
  })
})
