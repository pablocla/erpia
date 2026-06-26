import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { resumenCobranzasPendientes } from "@/lib/marketplace/cobranzas-wa-service"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const suscripcion = await prisma.suscripcionModulo.findFirst({
    where: { empresaId: auth.auth.empresaId, sku: "intang.cobranzas_wa", activo: true },
  })

  if (!suscripcion) {
    return NextResponse.json({ error: "SKU intang.cobranzas_wa no activo" }, { status: 403 })
  }

  const resumen = await resumenCobranzasPendientes(auth.auth.empresaId)

  return NextResponse.json({
    sku: "intang.cobranzas_wa",
    ...resumen,
    mensaje:
      resumen.saldoTotal > 0
        ? `Hay $${resumen.saldoTotal.toLocaleString("es-AR")} recuperables en ${resumen.contactablesWhatsApp} clientes contactables por WA.`
        : "Sin deuda vencida contactable por el momento.",
  })
}