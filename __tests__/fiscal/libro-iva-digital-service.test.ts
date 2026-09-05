import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { libroIvaDigitalService } from "@/lib/fiscal/libro-iva-digital-service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("LibroIvaDigitalService (AFIP RG 4597)", () => {
  describe("generarVentas", () => {
    it("debe generar registros de comprobantes de exactamente 266 caracteres y alícuotas de 62 caracteres", async () => {
      const mockFacturas = [
        {
          id: 1,
          tipo: "A",
          tipoCbte: 1,
          puntoVenta: 1,
          numero: 100,
          createdAt: new Date("2026-03-15T10:00:00Z"),
          subtotal: 10000,
          iva: 2100,
          total: 12100,
          totalPercepciones: 350,
          netoNoGravado: 0,
          netoExento: 0,
          monedaOrigen: "PES",
          tipoCambio: 1,
          cliente: {
            nombre: "Empresa Cliente S.A.",
            cuit: "30-71123456-7",
            dni: null,
          },
          lineas: [
            {
              id: 1,
              precioUnitario: 10000,
              cantidad: 1,
              subtotal: 10000,
              porcentajeIva: 21,
            },
          ],
        },
      ]

      mockPrismaClient.factura.findMany.mockResolvedValue(mockFacturas)

      const res = await libroIvaDigitalService.generarVentas(1, "2026-03")

      expect(res.cantidadComprobantes).toBe(1)
      expect(res.cantidadAlicuotas).toBe(1)

      const lineasCbte = res.comprobantesTxt.split("\r\n")
      const lineasAli = res.alicuotasTxt.split("\r\n")

      expect(lineasCbte[0].length).toBe(266)
      expect(lineasAli[0].length).toBe(62)

      // Verificaciones posicionales en comprobante de ventas
      expect(lineasCbte[0].substring(0, 8)).toBe("20260315") // Fecha
      expect(lineasCbte[0].substring(8, 11)).toBe("001") // Tipo Cbte Factura A
      expect(lineasCbte[0].substring(11, 16)).toBe("00001") // Punto de Venta
      expect(lineasCbte[0].substring(56, 58)).toBe("80") // Documento 80=CUIT
      expect(lineasCbte[0].substring(228, 231)).toBe("PES") // Moneda

      // Verificaciones en alícuota
      expect(lineasAli[0].substring(0, 3)).toBe("001")
      expect(lineasAli[0].substring(43, 47)).toBe("0005") // Código 0005 = 21%
    })
  })

  describe("generarCompras", () => {
    it("debe generar registros de comprobantes de compras de exactamente 325 caracteres y alícuotas de 84 caracteres", async () => {
      const mockCompras = [
        {
          id: 1,
          tipo: "A",
          puntoVenta: "00002",
          numero: "00005432",
          fecha: new Date("2026-03-20T12:00:00Z"),
          subtotal: 50000,
          iva: 10500,
          total: 60500,
          totalPercepciones: 0,
          netoNoGravado: 0,
          netoExento: 0,
          monedaOrigen: "PES",
          tipoCambio: 1,
          proveedor: {
            nombre: "Proveedor Mayorista S.R.L.",
            cuit: "30-55667788-9",
          },
          lineas: [],
        },
      ]

      mockPrismaClient.compra.findMany.mockResolvedValue(mockCompras)

      const res = await libroIvaDigitalService.generarCompras(1, "2026-03")

      expect(res.cantidadComprobantes).toBe(1)
      expect(res.cantidadAlicuotas).toBe(1)

      const lineasCbte = res.comprobantesTxt.split("\r\n")
      const lineasAli = res.alicuotasTxt.split("\r\n")

      expect(lineasCbte[0].length).toBe(325)
      expect(lineasAli[0].length).toBe(84)

      // Verificaciones posicionales en compras
      expect(lineasCbte[0].substring(0, 8)).toBe("20260320") // Fecha
      expect(lineasCbte[0].substring(8, 11)).toBe("001") // Tipo Cbte
      expect(lineasCbte[0].substring(52, 54)).toBe("80") // CUIT

      // Verificaciones en alícuota compras
      expect(lineasAli[0].substring(65, 69)).toBe("0005") // Código 21%
    })
  })
})
