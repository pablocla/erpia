import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { syncFacturasPendientes } from "@/lib/afip/sync-pendientes"
import { solicitarCaeFactura } from "@/lib/afip/solicitar-cae-factura"
import { emitirNotaCreditoAfip } from "@/lib/afip/emitir-nota-credito-afip"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/afip/reintentar-cae
 * Reintenta la emisión AFIP de facturas en estado pendiente_cae (empresa del usuario).
 * Body opcional: { facturaId?: number, notaCreditoId?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json().catch(() => ({})) as {
      facturaId?: number
      notaCreditoId?: number
    }

    if (body.facturaId) {
      const factura = await prisma.factura.findFirst({
        where: { id: body.facturaId, empresaId: ctx.auth.empresaId },
        select: { id: true, estado: true },
      })
      if (!factura) {
        return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
      }
      if (factura.estado !== "pendiente_cae" && factura.estado !== "error_cae") {
        return NextResponse.json({ error: "La factura no está pendiente de CAE" }, { status: 400 })
      }

      const afip = await solicitarCaeFactura(factura.id)
      return NextResponse.json({
        ok: afip.ok,
        sincronizadas: afip.ok ? 1 : 0,
        errores: afip.ok ? 0 : 1,
        mensaje: afip.ok
          ? "CAE obtenido correctamente"
          : (afip.error ?? "No se pudo obtener CAE"),
      }, { status: afip.ok ? 200 : 422 })
    }

    if (body.notaCreditoId) {
      const nc = await prisma.notaCredito.findFirst({
        where: { id: body.notaCreditoId, empresaId: ctx.auth.empresaId },
        select: { id: true, estado: true },
      })
      if (!nc) {
        return NextResponse.json({ error: "Nota de crédito no encontrada" }, { status: 404 })
      }
      if (nc.estado !== "pendiente_cae" && nc.estado !== "error_cae") {
        return NextResponse.json({ error: "La NC no está pendiente de CAE" }, { status: 400 })
      }

      const afip = await emitirNotaCreditoAfip(nc.id)
      return NextResponse.json({
        ok: afip.ok,
        sincronizadas: afip.ok ? 1 : 0,
        errores: afip.ok ? 0 : 1,
        mensaje: afip.ok
          ? "CAE de NC obtenido correctamente"
          : (afip.error ?? "No se pudo obtener CAE"),
      }, { status: afip.ok ? 200 : 422 })
    }

    const result = await syncFacturasPendientes(ctx.auth.empresaId)

    return NextResponse.json({
      ok: true,
      procesadas: result.procesadas,
      sincronizadas: result.sincronizadas,
      errores: result.errores,
      omitidas: result.omitidas,
      mensaje:
        result.sincronizadas > 0
          ? `${result.sincronizadas} comprobante(s) sincronizado(s) con AFIP`
          : result.procesadas === 0
            ? "No hay comprobantes pendientes de CAE"
            : "No se pudo obtener CAE. Revisá certificado o reintentá más tarde.",
    })
  } catch (error) {
    console.error("Error en /api/afip/reintentar-cae:", error)
    return NextResponse.json({ error: "Error al reintentar CAE" }, { status: 500 })
  }
}