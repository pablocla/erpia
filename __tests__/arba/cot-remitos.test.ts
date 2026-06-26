import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { cotService } from "@/lib/arba/cot-service"

describe("COTService - Código de Operación de Transporte (ARBA)", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default configuration fallbacks are used if parametroFiscal lookup returns null
    mockPrismaClient.parametroFiscal.findFirst.mockResolvedValue(null)
    mockPrismaClient.cOT.upsert.mockResolvedValue({
      id: 5,
      numeroCOT: "AB1234567890123",
      estado: "aprobado",
    })
    mockPrismaClient.remito.update.mockResolvedValue({
      id: 1,
    })
  })

  it("debe retornar error si el remito no existe", async () => {
    mockPrismaClient.remito.findUnique.mockResolvedValue(null)

    const res = await cotService.procesarCOT(999)
    expect(res.success).toBe(false)
    expect(res.error).toContain("no encontrado")
  })

  it("debe omitir el COT si el destino no es la Provincia de Buenos Aires", async () => {
    mockPrismaClient.remito.findUnique.mockResolvedValue({
      id: 1,
      empresaId: 1,
      cliente: {
        direccion: "Av. Colón 1000",
        provincia: {
          nombre: "Córdoba",
        },
      },
      lineas: [],
    })

    const res = await cotService.procesarCOT(1)
    expect(res.success).toBe(false)
    expect(res.error).toContain("no es en la Provincia de Buenos Aires")
  })

  it("debe omitir el COT si la mercadería no supera los umbrales mínimos de peso o valor", async () => {
    mockPrismaClient.remito.findUnique.mockResolvedValue({
      id: 1,
      empresaId: 1,
      cliente: {
        direccion: "Calle Falsa 123",
        provincia: {
          nombre: "Provincia de Buenos Aires",
        },
      },
      lineas: [
        {
          cantidad: 10,
          producto: {
            peso: 5, // 50kg en total (Menor a 4500kg)
            pesoUnidad: "kg",
            precioBase: 100, // $1000 en total (Menor a $45000)
          },
        },
      ],
    })

    const res = await cotService.procesarCOT(1)
    expect(res.success).toBe(false)
    expect(res.error).toContain("No supera los umbrales requeridos")
  })

  it("debe tramitar el COT exitosamente si supera el umbral de valor", async () => {
    mockPrismaClient.remito.findUnique.mockResolvedValue({
      id: 1,
      empresaId: 1,
      empresa: {
        cuit: "30-12345678-9",
      },
      cliente: {
        cuit: "20-99999999-9",
        direccion: "San Martín 500, Ramos Mejía",
        provincia: {
          nombre: "PBA",
        },
      },
      lineas: [
        {
          cantidad: 10,
          producto: {
            peso: 1, // 10kg
            pesoUnidad: "kg",
            precioVenta: 8000, // $80.000 total (supera $45.000)
          },
        },
      ],
    })

    const res = await cotService.procesarCOT(1)
    expect(res.success).toBe(true)
    expect(res.numeroCOT).toBeDefined()
    expect(res.numeroCOT?.startsWith("AB")).toBe(true)
    expect(mockPrismaClient.cOT.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { remitoId: 1 },
        create: expect.objectContaining({
          estado: "aprobado",
          cuitEmisor: "30-12345678-9",
          cuitReceptor: "20-99999999-9",
        }),
      })
    )
  })

  it("debe tramitar el COT exitosamente si supera el umbral de peso", async () => {
    mockPrismaClient.remito.findUnique.mockResolvedValue({
      id: 1,
      empresaId: 1,
      empresa: {
        cuit: "30-12345678-9",
      },
      cliente: {
        cuit: "20-99999999-9",
        direccion: "Camino de Cintura 200",
        provincia: {
          nombre: "Buenos Aires",
        },
      },
      lineas: [
        {
          cantidad: 5,
          producto: {
            peso: 1000, // 5000kg total (supera 4500kg)
            pesoUnidad: "kg",
            precioBase: 100, // $500 total
          },
        },
      ],
    })

    const res = await cotService.procesarCOT(1)
    expect(res.success).toBe(true)
    expect(res.numeroCOT).toBeDefined()
    expect(res.numeroCOT?.length).toBe(15) // AB + 13 dígitos = 15 chars
  })
})
