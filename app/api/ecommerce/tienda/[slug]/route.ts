import { type NextRequest, NextResponse } from "next/server"
import { getTiendaConfigBySlug } from "@/lib/ecommerce/store-config-service"
import { logError } from "@/lib/monitoring/error-logger"

/** Config pública de tienda por slug (/tienda/[slug]) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const config = await getTiendaConfigBySlug(slug)
    if (!config) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ configurada: true, ...config })
  } catch (error) {
    logError("api/ecommerce/tienda/[slug]:GET", error, request)
    return NextResponse.json({ error: "Error al cargar tienda" }, { status: 500 })
  }
}