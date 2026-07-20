import { prisma } from "@/lib/prisma"

// Servicio stubbed para facturación de exportación.
// Mantenerlo separado evita conflictos con el WSFEV1 (Facturas A, B, C) existente.

export async function emitirFacturaExportacion(empresaId: number, clienteId: number, incoterm: string, total: number) {
  // 1. Validar que la empresa tenga certificado y CUIT
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId }
  })

  if (!empresa.certificadoCRT || !empresa.clavePrivada) {
    throw new Error("La empresa no posee certificados AFIP cargados para Facturación de Exportación (WSFEX)")
  }

  throw new Error("El servicio WSFEX (Facturación de Exportación) requiere conexión SOAP AFIP activa")
}
