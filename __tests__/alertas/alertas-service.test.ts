/**
 * Alertas Service — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  crearReglaAlerta,
  listarReglasAlerta,
  toggleReglaAlerta,
  eliminarReglaAlerta,
  evaluarReglas,
} from "@/lib/alertas/alertas-service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Alertas Service", () => {
  const empresaId = 1

  describe("crearReglaAlerta", () => {
    it("should create a rule with serialized condicion", async () => {
      mockPrismaClient.reglaAlerta.create.mockResolvedValue({ id: 1 })

      await crearReglaAlerta({
        empresaId,
        nombre: "Stock bajo",
        tipoRegla: "stock_bajo",
        condicion: { operador: "mayor", valor: 5 },
      })

      expect(mockPrismaClient.reglaAlerta.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          empresaId,
          nombre: "Stock bajo",
          tipoRegla: "stock_bajo",
          condicion: JSON.stringify({ operador: "mayor", valor: 5 }),
          accion: "notificacion",
          frecuenciaHoras: 24,
        }),
      })
    })
  })

  describe("listarReglasAlerta", () => {
    it("should list scoped by empresa", async () => {
      mockPrismaClient.reglaAlerta.findMany.mockResolvedValue([])

      await listarReglasAlerta(empresaId)

      expect(mockPrismaClient.reglaAlerta.findMany).toHaveBeenCalledWith({
        where: { empresaId },
        orderBy: { createdAt: "desc" },
      })
    })
  })

  describe("toggleReglaAlerta", () => {
    it("should toggle active state", async () => {
      mockPrismaClient.reglaAlerta.update.mockResolvedValue({ id: 1 })

      await toggleReglaAlerta(empresaId, 1, false)

      expect(mockPrismaClient.reglaAlerta.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { activo: false },
      })
    })
  })

  describe("eliminarReglaAlerta", () => {
    it("should delete existing rule", async () => {
      mockPrismaClient.reglaAlerta.findFirst.mockResolvedValue({ id: 1, empresaId })
      mockPrismaClient.reglaAlerta.delete.mockResolvedValue({ id: 1 })

      await eliminarReglaAlerta(empresaId, 1)

      expect(mockPrismaClient.reglaAlerta.delete).toHaveBeenCalledWith({ where: { id: 1 } })
    })

    it("should throw if rule not found", async () => {
      mockPrismaClient.reglaAlerta.findFirst.mockResolvedValue(null)

      await expect(eliminarReglaAlerta(empresaId, 999)).rejects.toThrow("Regla no encontrada")
    })
  })

  describe("evaluarReglas", () => {
    it("should detect stock_bajo", async () => {
      mockPrismaClient.reglaAlerta.findMany.mockResolvedValue([
        {
          id: 1,
          nombre: "Stock bajo",
          tipoRegla: "stock_bajo",
          condicion: JSON.stringify({ operador: "mayor", valor: 0 }),
          activo: true,
        },
      ])
      mockPrismaClient.producto.findMany.mockResolvedValue([
        { id: 1, nombre: "Producto A", stock: 2, stockMinimo: 10 },
      ])
      mockPrismaClient.reglaAlerta.update.mockResolvedValue({})

      const result = await evaluarReglas(empresaId)

      expect(result).toHaveLength(1)
      expect(result[0].disparada).toBe(true)
      expect(result[0].mensaje).toContain("Producto A")
    })

    it("should detect cxc_vencida", async () => {
      mockPrismaClient.reglaAlerta.findMany.mockResolvedValue([
        {
          id: 2,
          nombre: "CxC vencidas",
          tipoRegla: "cxc_vencida",
          condicion: JSON.stringify({ operador: "mayor", valor: 7 }),
          activo: true,
        },
      ])
      mockPrismaClient.cuentaCobrar.count.mockResolvedValue(5)
      mockPrismaClient.reglaAlerta.update.mockResolvedValue({})

      const result = await evaluarReglas(empresaId)

      expect(result[0].disparada).toBe(true)
      expect(result[0].mensaje).toContain("5 cuentas a cobrar vencidas")
    })

    it("should not trigger when no issues", async () => {
      mockPrismaClient.reglaAlerta.findMany.mockResolvedValue([
        {
          id: 3,
          nombre: "Sin stock bajo",
          tipoRegla: "stock_bajo",
          condicion: JSON.stringify({ operador: "mayor", valor: 0 }),
          activo: true,
        },
      ])
      mockPrismaClient.producto.findMany.mockResolvedValue([
        { id: 1, nombre: "OK", stock: 100, stockMinimo: 10 },
      ])
      mockPrismaClient.reglaAlerta.update.mockResolvedValue({})

      const result = await evaluarReglas(empresaId)

      expect(result[0].disparada).toBe(false)
    })
  })
})
