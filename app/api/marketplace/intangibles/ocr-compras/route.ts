import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getFeatureConfig } from "@/lib/config/rubro-config-service"
import { estaProductoActivo } from "@/lib/platform/product-lifecycle"

/**
 * GET — estado del buzón OCR compras
 * POST — stub de ingest (PDF/XML → cola de procesamiento)
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const activo = await estaProductoActivo(ctx.auth.empresaId, "intang.ocr_compras")
  const feature = await getFeatureConfig(ctx.auth.empresaId, "intang.ocr_compras")
  const inboxAlias =
    (feature.parametros?.inboxAlias as string | undefined) ??
    `compras+emp${ctx.auth.empresaId}@claver.com`

  return NextResponse.json({
    activo,
    inboxAlias,
    docsIncluidosMes: feature.parametros?.docsIncluidosMes ?? 100,
    precioDocExtraArs: feature.parametros?.precioDocExtraArs ?? 99,
    estado: activo ? "listo" : "requiere_activacion",
  })
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const activo = await estaProductoActivo(ctx.auth.empresaId, "intang.ocr_compras")
  if (!activo) {
    return NextResponse.json({ error: "Activá intang.ocr_compras primero" }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const archivo = typeof body.archivo === "string" ? body.archivo : "documento.pdf"

  return NextResponse.json({
    ok: true,
    estado: "en_cola",
    mensaje: `Documento ${archivo} encolado para extracción IA (stub)`,
    jobId: `ocr-${ctx.auth.empresaId}-${Date.now()}`,
  })
}