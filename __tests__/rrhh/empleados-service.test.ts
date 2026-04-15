/**
 * Empleados / RRHH Service — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  crearEmpleado,
  actualizarEmpleado,
  listarEmpleados,
  obtenerEmpleado,
  darBajaEmpleado,
  resumenEmpleados,
} from "@/lib/rrhh/empleados-service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Empleados Service", () => {
  const empresaId = 1

  describe("crearEmpleado", () => {
    it("should create with valid CUIL", async () => {
      mockPrismaClient.empleado.create.mockResolvedValue({ id: 1 })

      await crearEmpleado({
        empresaId,
        nombre: "Juan Pérez",
        cuil: "20-12345678-9",
        fechaIngreso: new Date("2024-01-01"),
      })

      expect(mockPrismaClient.empleado.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          empresaId,
          nombre: "Juan Pérez",
          cuil: "20-12345678-9",
          modalidad: "relacion_dependencia",
          tipoJornada: "completa",
        }),
      })
    })

    it("should reject invalid CUIL format", async () => {
      await expect(
        crearEmpleado({
          empresaId,
          nombre: "Test",
          cuil: "123456",
          fechaIngreso: new Date(),
        }),
      ).rejects.toThrow("CUIL inválido")
    })
  })

  describe("actualizarEmpleado", () => {
    it("should update employee data", async () => {
      mockPrismaClient.empleado.update.mockResolvedValue({ id: 1 })

      await actualizarEmpleado(empresaId, 1, { cargo: "Gerente" })

      expect(mockPrismaClient.empleado.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { cargo: "Gerente" },
      })
    })

    it("should reject invalid CUIL on update", async () => {
      await expect(
        actualizarEmpleado(empresaId, 1, { cuil: "bad-cuil" }),
      ).rejects.toThrow("CUIL inválido")
    })
  })

  describe("listarEmpleados", () => {
    it("should list with filters", async () => {
      mockPrismaClient.empleado.findMany.mockResolvedValue([])

      await listarEmpleados(empresaId, { estado: "activo", departamento: "Ventas" })

      expect(mockPrismaClient.empleado.findMany).toHaveBeenCalledWith({
        where: { empresaId, estado: "activo", departamento: "Ventas" },
        orderBy: { nombre: "asc" },
      })
    })

    it("should search by name/cuil/dni", async () => {
      mockPrismaClient.empleado.findMany.mockResolvedValue([])

      await listarEmpleados(empresaId, { busqueda: "juan" })

      expect(mockPrismaClient.empleado.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ nombre: { contains: "juan", mode: "insensitive" } }),
            ]),
          }),
        }),
      )
    })
  })

  describe("obtenerEmpleado", () => {
    it("should fetch scoped by empresa", async () => {
      mockPrismaClient.empleado.findFirst.mockResolvedValue({ id: 1, nombre: "Juan" })

      const result = await obtenerEmpleado(empresaId, 1)

      expect(result).toEqual({ id: 1, nombre: "Juan" })
      expect(mockPrismaClient.empleado.findFirst).toHaveBeenCalledWith({
        where: { id: 1, empresaId },
      })
    })
  })

  describe("darBajaEmpleado", () => {
    it("should set estado to baja with fechaEgreso", async () => {
      const fecha = new Date("2025-06-01")
      mockPrismaClient.empleado.update.mockResolvedValue({ id: 1, estado: "baja" })

      await darBajaEmpleado(empresaId, 1, fecha)

      expect(mockPrismaClient.empleado.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: "baja", fechaEgreso: fecha },
      })
    })
  })

  describe("resumenEmpleados", () => {
    it("should return counts and groupBy", async () => {
      mockPrismaClient.empleado.count
        .mockResolvedValueOnce(10)  // activos
        .mockResolvedValueOnce(2)   // licencia
        .mockResolvedValueOnce(1)   // baja
      mockPrismaClient.empleado.groupBy.mockResolvedValue([
        { departamento: "Ventas", _count: 5 },
        { departamento: "Admin", _count: 5 },
      ])

      const result = await resumenEmpleados(empresaId)

      expect(result.activos).toBe(10)
      expect(result.licencia).toBe(2)
      expect(result.baja).toBe(1)
      expect(result.total).toBe(13)
      expect(result.porDepartamento).toHaveLength(2)
    })
  })
})
