import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { publicarProductoMasivo } from "@/lib/mercadolibre/mercadolibre-service"

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { productosIds, canales } = body as { productosIds: number[]; canales: string[] }

    if (!productosIds || productosIds.length === 0) {
      return NextResponse.json({ error: "Faltan productosIds" }, { status: 400 })
    }

    if (!canales || canales.length === 0) {
      return NextResponse.json({ error: "Debe seleccionar al menos un canal (ej: 'ML')" }, { status: 400 })
    }

    const resultados: Record<string, any> = {}

    if (canales.includes("ML")) {
      const resML = await publicarProductoMasivo(auth.auth.empresaId, productosIds)
      resultados.mercadolibre = resML
    }

    if (canales.includes("TN")) {
      const { publicarProductoMasivoTN } = await import("@/lib/tiendanube/tiendanube-service")
      const resTN = await publicarProductoMasivoTN(auth.auth.empresaId, productosIds)
      resultados.tiendanube = resTN
    }

    if (canales.includes("SH") || canales.includes("SHOPIFY")) {
      const { publicarProductoMasivoShopify } = await import("@/lib/shopify/shopify-service")
      const resSH = await publicarProductoMasivoShopify(auth.auth.empresaId, productosIds)
      resultados.shopify = resSH
    }

    return NextResponse.json({ ok: true, resultados })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Error interno al publicar masivamente" },
      { status: 500 }
    )
  }
}
