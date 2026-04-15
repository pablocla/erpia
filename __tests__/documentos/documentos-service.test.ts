/**
 * Documentos Adjuntos Service — Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockPrismaClient } from "../setup"
import {
  adjuntarDocumento,
  listarDocumentos,
  eliminarDocumento,
  contarDocumentos,
} from "@/lib/documentos/documentos-service"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Documentos Adjuntos Service", () => {
  const empresaId = 1

  describe("adjuntarDocumento", () => {
    it("should create a document with valid input", async () => {
      const input = {
        empresaId,
        entidadTipo: "factura" as const,
        entidadId: 10,
        nombreArchivo: "factura.pdf",
        mimeType: "application/pdf",
        tamanio: 5000,
        url: "https://storage.example.com/factura.pdf",
        storageKey: "docs/factura.pdf",
        categoria: "constancia_afip" as const,
      }
      mockPrismaClient.documentoAdjunto.create.mockResolvedValue({ id: 1, ...input })

      const result = await adjuntarDocumento(input)

      expect(mockPrismaClient.documentoAdjunto.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          empresaId,
          entidadTipo: "factura",
          mimeType: "application/pdf",
          categoria: "constancia_afip",
        }),
      })
      expect(result.id).toBe(1)
    })

    it("should reject disallowed MIME types", async () => {
      await expect(
        adjuntarDocumento({
          empresaId,
          entidadTipo: "factura",
          entidadId: 10,
          nombreArchivo: "virus.exe",
          mimeType: "application/x-msdownload",
          tamanio: 100,
          url: "x",
          storageKey: "x",
        }),
      ).rejects.toThrow("Tipo de archivo no permitido")
    })

    it("should reject files over 10 MB", async () => {
      await expect(
        adjuntarDocumento({
          empresaId,
          entidadTipo: "factura",
          entidadId: 10,
          nombreArchivo: "huge.pdf",
          mimeType: "application/pdf",
          tamanio: 11 * 1024 * 1024,
          url: "x",
          storageKey: "x",
        }),
      ).rejects.toThrow("excede el tamaño máximo")
    })
  })

  describe("listarDocumentos", () => {
    it("should query scoped by empresa and entidad", async () => {
      mockPrismaClient.documentoAdjunto.findMany.mockResolvedValue([])

      await listarDocumentos(empresaId, "cliente", 5)

      expect(mockPrismaClient.documentoAdjunto.findMany).toHaveBeenCalledWith({
        where: { empresaId, entidadTipo: "cliente", entidadId: 5 },
        orderBy: { createdAt: "desc" },
      })
    })
  })

  describe("eliminarDocumento", () => {
    it("should delete an existing document", async () => {
      mockPrismaClient.documentoAdjunto.findFirst.mockResolvedValue({ id: 7, empresaId })
      mockPrismaClient.documentoAdjunto.delete.mockResolvedValue({ id: 7 })

      const result = await eliminarDocumento(empresaId, 7)

      expect(result.id).toBe(7)
    })

    it("should throw if document not found", async () => {
      mockPrismaClient.documentoAdjunto.findFirst.mockResolvedValue(null)

      await expect(eliminarDocumento(empresaId, 999)).rejects.toThrow("Documento no encontrado")
    })
  })

  describe("contarDocumentos", () => {
    it("should count documents for entity", async () => {
      mockPrismaClient.documentoAdjunto.count.mockResolvedValue(3)

      const result = await contarDocumentos(empresaId, "proveedor", 2)

      expect(result).toBe(3)
    })
  })
})
