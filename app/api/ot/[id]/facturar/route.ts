import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { OTService } from "@/lib/ot/ot-service"

/**
 * POST /api/ot/[id]/facturar
 * Facturación 1-click desde Orden de Trabajo (repuestos + mano de obra).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const otId = Number.parseInt(id, 10)
    if (!Number.isFinite(otId) || otId <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = (await request.json().catch(() => ({}))) as {
      tipo?: "A" | "B" | "C"
      alicuotaIva?: number
      solicitarCae?: boolean
    }

    const result = await new OTService().facturar(auth.auth.empresaId, otId, {
      tipo: body.tipo,
      alicuotaIva: body.alicuotaIva,
      solicitarCae: body.solicitarCae,
    })

    return NextResponse.json({
      ok: true,
      factura: result.factura,
      yaFacturada: result.yaFacturada,
      caeResult: result.caeResult,
      printUrl: result.printUrl,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error al facturar la OT"
    console.error("[POST /api/ot/:id/facturar]", error)
    const status =
      msg.includes("no encontrada") || msg.includes("cancelada") || msg.includes("ítems")
        ? 400
        : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
