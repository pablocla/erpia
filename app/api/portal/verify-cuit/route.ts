import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getOpoConfig } from "@/lib/opo/opo-config-service"
import { resolveErpAdapter } from "@/lib/legacy-bridge/adapter-registry"

const schema = z.object({
  cuit: z.string().min(10).max(13),
  empresaId: z.number().int().positive(),
})

/**
 * POST /api/portal/verify-cuit
 * Verifica que el CUIT pertenece a un cliente activo de la empresa.
 * Enrutado vía OPO Legacy Bridge.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }

    const { cuit, empresaId } = parsed.data
    const cleanCuit = cuit.replace(/-/g, "")

    const config = await getOpoConfig(empresaId)
    const adapter = resolveErpAdapter(config)

    // Fetch via Legacy Bridge (OPO)
    const result = await adapter.query(empresaId, {
      entity: "Customer",
      action: "read",
      params: { 
        cuit: cleanCuit,
        limit: 1
      }
    }, config)

    if (result.count === 0 || !result.data[0]) {
      return NextResponse.json(
        { error: "No encontramos un cliente activo con ese CUIT. Contactá a tu vendedor." },
        { status: 404 }
      )
    }

    const rawCustomer = result.data[0] as any

    // Mapear de OPO Canonical a la estructura que espera el Frontend del Portal B2B
    const cliente = {
      id: Number(rawCustomer.id) || 0,
      nombre: rawCustomer.legalName || rawCustomer.tradeName || "",
      cuit: rawCustomer.partyId || cleanCuit,
      saldoCuentaCorriente: Number(rawCustomer.outstandingBalance) || 0,
      limiteCredito: Number(rawCustomer.creditLimit) || 0,
      condicionIva: rawCustomer.taxCondition || "Responsable Inscripto",
      email: rawCustomer.email || "",
      telefono: rawCustomer.phone || ""
    }

    return NextResponse.json({ cliente })
  } catch (error) {
    console.error("portal/verify-cuit:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
