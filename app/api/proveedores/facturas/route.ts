import { NextRequest, NextResponse } from "next/server"
import { getOpoConfig } from "@/lib/opo/opo-config-service"
import { resolveErpAdapter } from "@/lib/legacy-bridge/adapter-registry"

export async function POST(request: NextRequest) {
  try {
    const { empresaId, cuitProveedor, facturaData } = await request.json()

    if (!empresaId || !cuitProveedor || !facturaData) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    const config = await getOpoConfig(empresaId)
    const adapter = resolveErpAdapter(config)

    // El frontend nos envía los datos del QR ya parseados (FacturaAfipQR)
    // Los mapeamos al formato canónico de Invoice de compras
    const invoicePayload = {
      supplierId: String(cuitProveedor),
      number: String(facturaData.nroCmp),
      series: String(facturaData.ptoVta),
      issueDate: facturaData.fecha,
      totalAmount: Number(facturaData.importe),
      currency: facturaData.moneda || "ARS",
      cae: String(facturaData.codAut),
      // Atributo específico para compras
      isPurchase: true
    }

    // Usar el adapter para enviar la factura al ERP
    // Si config apunta a Protheus, esto creará una Factura de Entrada (Documento de Entrada)
    const result = await adapter.query(empresaId, {
      entity: "Invoice",
      action: "create",
      params: { payload: invoicePayload }
    }, config)

    return NextResponse.json({ success: true, result: result.data[0] })
  } catch (error) {
    console.error("Error cargando factura de proveedor:", error)
    return NextResponse.json({ error: "Error al cargar la factura en el ERP" }, { status: 500 })
  }
}
