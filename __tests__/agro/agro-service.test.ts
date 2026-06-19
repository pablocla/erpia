import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { agroService } from "@/lib/agro/agro-service"

beforeEach(() => vi.clearAllMocks())

describe("agroService", () => {
  it("pizarraActual retorna último precio por grano", async () => {
    mockPrismaClient.agroGrano.findMany.mockResolvedValue([
      { id: 1, nombre: "Soja", codigo: "SOJ" },
      { id: 2, nombre: "Maíz", codigo: "MAI" },
    ])
    mockPrismaClient.agroPrecioPizarra.findFirst
      .mockResolvedValueOnce({ precio: 350000, moneda: "ARS", fuente: "BCR", variacion: 2.5, fechaData: new Date() })
      .mockResolvedValueOnce(null)

    const result = await agroService.pizarraActual(1)

    expect(result).toHaveLength(2)
    expect(result[0].precio).toBe(350000)
    expect(result[1].precio).toBeNull()
  })

  it("crearTicket calcula peso neto y correlativo", async () => {
    mockPrismaClient.$transaction.mockImplementation(async (fn: (tx: typeof mockPrismaClient) => unknown) => fn(mockPrismaClient))
    mockPrismaClient.agroTicketBalanza.findFirst.mockResolvedValue({ numero: "000005" })
    mockPrismaClient.agroTicketBalanza.create.mockResolvedValue({
      id: 10,
      numero: "000006",
      pesoNeto: 28500,
      factorCalidad: 0.98,
    })

    const ticket = await agroService.crearTicket(1, {
      tipo: "entrada",
      granoId: 1,
      pesoBruto: 30000,
      tara: 1500,
      humedad: 14,
    })

    expect(mockPrismaClient.agroTicketBalanza.create).toHaveBeenCalled()
    expect(ticket.numero).toBe("000006")
  })

  it("stockPorGrano agrega toneladas por grano", async () => {
    mockPrismaClient.agroSilo.findMany.mockResolvedValue([
      { grano: { nombre: "Soja" }, stockActualTn: 120, capacidadTn: 500 },
      { grano: { nombre: "Soja" }, stockActualTn: 80, capacidadTn: 300 },
    ])

    const result = await agroService.stockPorGrano(1)
    expect(result[0].totalTn).toBe(200)
    expect(result[0].capacidadTn).toBe(800)
  })
})