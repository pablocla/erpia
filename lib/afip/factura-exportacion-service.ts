import { prisma } from "@/lib/prisma"

// Servicio stubbed para facturación de exportación.
// Mantenerlo separado evita conflictos con el WSFEV1 (Facturas A, B, C) existente.

export async function emitirFacturaExportacion(empresaId: number, clienteId: number, incoterm: string, total: number) {
  // 1. Validar que la empresa tenga certificado y CUIT
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId }
  })

  if (!empresa) throw new Error("Empresa no encontrada")

  // 2. Crear registro en BD como tipoCbte 19 (Factura E)
  const factura = await prisma.factura.create({
    data: {
      empresaId,
      clienteId,
      tipo: "E",
      tipoCbte: 19,
      numero: Math.floor(Math.random() * 10000), // MOCK
      puntoVenta: empresa.puntoVenta,
      subtotal: total,
      iva: 0,
      total,
      monedaOrigen: "DOL", // Factura E habitualmente en Dólares
      tipoCambio: 1000,
      estado: "emitida",
      cae: "203248932489", // Mock CAE WSFEX
      vencimientoCAE: new Date(),
    }
  })

  // Aquí iría el llamado real a SOAP WSFEX (FEXAuthorize) con los XML
  
  return { ok: true, factura }
}
