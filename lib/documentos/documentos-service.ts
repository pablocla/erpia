/**
 * Documentos Adjuntos / GED Service
 *
 * Sistema polimórfico de adjuntos: cualquier entidad (factura, compra, OC,
 * cliente, proveedor, etc.) puede tener documentos asociados.
 * Storage: Supabase Storage (o S3 compatible).
 */

import { prisma } from "@/lib/prisma"

export type EntidadTipo =
  | "factura"
  | "compra"
  | "cliente"
  | "proveedor"
  | "orden_compra"
  | "pedido_venta"
  | "remito"
  | "asiento"
  | "activo_fijo"
  | "inspeccion"
  | "legajo"

export type CategoriaDoc =
  | "constancia_afip"
  | "contrato"
  | "remito_firmado"
  | "cert_exclusion"
  | "presupuesto"
  | "otro"

export interface AdjuntarDocumentoInput {
  empresaId: number
  entidadTipo: EntidadTipo
  entidadId: number
  nombreArchivo: string
  mimeType: string
  tamanio: number
  url: string
  storageKey: string
  categoria?: CategoriaDoc
  descripcion?: string
  subidoPor?: number
}

const ALLOWED_MIMES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/plain",
]

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function adjuntarDocumento(input: AdjuntarDocumentoInput) {
  if (!ALLOWED_MIMES.includes(input.mimeType)) {
    throw new Error(`Tipo de archivo no permitido: ${input.mimeType}`)
  }
  if (input.tamanio > MAX_SIZE) {
    throw new Error(`El archivo excede el tamaño máximo de 10 MB`)
  }

  return prisma.documentoAdjunto.create({
    data: {
      entidadTipo: input.entidadTipo,
      entidadId: input.entidadId,
      nombreArchivo: input.nombreArchivo,
      mimeType: input.mimeType,
      tamanio: input.tamanio,
      url: input.url,
      storageKey: input.storageKey,
      categoria: input.categoria ?? "otro",
      descripcion: input.descripcion,
      subidoPor: input.subidoPor,
      empresaId: input.empresaId,
    },
  })
}

export async function listarDocumentos(
  empresaId: number,
  entidadTipo: EntidadTipo,
  entidadId: number,
) {
  return prisma.documentoAdjunto.findMany({
    where: { empresaId, entidadTipo, entidadId },
    orderBy: { createdAt: "desc" },
  })
}

export async function eliminarDocumento(empresaId: number, documentoId: number) {
  const doc = await prisma.documentoAdjunto.findFirst({
    where: { id: documentoId, empresaId },
  })
  if (!doc) throw new Error("Documento no encontrado")

  // TODO: eliminar del storage (supabase.storage.from('docs').remove([doc.storageKey]))

  return prisma.documentoAdjunto.delete({
    where: { id: documentoId },
  })
}

export async function contarDocumentos(empresaId: number, entidadTipo: EntidadTipo, entidadId: number) {
  return prisma.documentoAdjunto.count({
    where: { empresaId, entidadTipo, entidadId },
  })
}
