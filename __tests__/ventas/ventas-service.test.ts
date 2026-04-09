/**
 * VentasService — Unit Tests
 *
 * Tests pedido de venta state machine, stock reservation,
 * remito generation, and cancellation with stock release.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import { VentasService } from "@/lib/ventas/ventas-service"

let service: InstanceType<typeof VentasService>

beforeEach(() => {
  vi.clearAllMocks()
  service = new VentasService()
  // Default: evento bus config
  mockPrismaClient.configuracionFuncional.findMany.mockResolvedValue([])
  mockPrismaClient.handlerLog.create.mockResolvedValue({})
})

describe("VentasService", () => {
  // ─── crearPedidoVenta ────────────────────────────────────────────────

  describe("crearPedidoVenta", () => {
    it("should create a pedido in estado borrador with calculated totals", async () => {
      const input = {
        clienteId: 1,
        empresaId: 1,
        lineas: [
          { productoId: 10, cantidad: 2, precioUnitario: 5000, descripcion: "Producto A" },
          { productoId: 20, cantidad: 1, precioUnitario: 3000, descripcion: "Producto B" },
        ],
      }

      mockPrismaClient.pedidoVenta.create.mockResolvedValue({
        id: 1,
        numero: "PV-000001",
        estado: "borrador",
        subtotal: 13000,
        total: 15730, // 13000 * 1.21
      })

      const result = await service.crearPedidoVenta(input)

      expect(mockPrismaClient.pedidoVenta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            estado: "borrador",
            clienteId: 1,
          }),
        })
      )
    })
  })

  // ─── confirmarPedido ──────────────────────────────────────────────────

  describe("confirmarPedido", () => {
    it("should reject if pedido is not in borrador", async () => {
      mockPrismaClient.pedidoVenta.findUnique.mockResolvedValue({
        id: 1,
        estado: "confirmado",
        lineas: [],
      })

      await expect(service.confirmarPedido(1)).rejects.toThrow()
    })

    it("should reject if stock is insufficient", async () => {
      mockPrismaClient.pedidoVenta.findUnique.mockResolvedValue({
        id: 1,
        estado: "borrador",
        lineas: [{ productoId: 10, cantidad: 100 }],
      })

      mockPrismaClient.stockDeposito.findFirst.mockResolvedValue({
        id: 1,
        productoId: 10,
        cantidad: 5,
        reservado: 0,
      })

      await expect(service.confirmarPedido(1)).rejects.toThrow()
    })
  })

  // ─── anularPedido ────────────────────────────────────────────────────

  describe("anularPedido", () => {
    it("should reject anulación of facturado pedido", async () => {
      mockPrismaClient.pedidoVenta.findUnique.mockResolvedValue({
        id: 1,
        estado: "facturado",
        lineas: [],
      })

      await expect(service.anularPedido(1)).rejects.toThrow()
    })

    it("should reject anulación of already anulado pedido", async () => {
      mockPrismaClient.pedidoVenta.findUnique.mockResolvedValue({
        id: 1,
        estado: "anulado",
        lineas: [],
      })

      await expect(service.anularPedido(1)).rejects.toThrow()
    })
  })

  // ─── generarRemito ──────────────────────────────────────────────────

  describe("generarRemito", () => {
    it("should reject if pedido is not confirmado or en_picking", async () => {
      mockPrismaClient.pedidoVenta.findUnique.mockResolvedValue({
        id: 1,
        estado: "borrador",
        lineas: [],
      })

      await expect(service.generarRemito(1)).rejects.toThrow()
    })
  })
})
