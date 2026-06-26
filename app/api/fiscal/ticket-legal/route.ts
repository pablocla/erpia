import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { buildTicketLegalFromFactura } from "@/lib/fiscal/ticket-legal"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const facturaId = Number(new URL(request.url).searchParams.get("facturaId"))
  if (!facturaId) {
    return NextResponse.json({ error: "facturaId requerido" }, { status: 400 })
  }

  const factura = await prisma.factura.findFirst({
    where: { id: facturaId, empresaId: auth.auth.empresaId },
    select: { id: true },
  })
  if (!factura) {
    return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
  }

  const ticket = await buildTicketLegalFromFactura(facturaId)
  if (!ticket) {
    return NextResponse.json({ error: "No se pudo armar el comprobante" }, { status: 404 })
  }

  return NextResponse.json(ticket)
}