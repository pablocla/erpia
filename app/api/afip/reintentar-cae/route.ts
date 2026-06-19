import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { syncFacturasPendientes } from "@/lib/afip/sync-pendientes"

/**
 * POST /api/afip/reintentar-cae
 * Reintenta la emisión AFIP de facturas en estado pendiente_cae (empresa del usuario).
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

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