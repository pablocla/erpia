import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { indexarPrecioCatalogo, getCatalogPriceBasePeriod } from "@/lib/inflacion"
import { z } from "zod"

/**
 * GET /api/inflacion/billing-preview?precio=24900
 * Preview de indexación de precios Claver (dueño de plataforma / demo).
 * No requiere ser superadmin: solo lectura de factor de catálogo.
 */
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  const precio = Number(req.nextUrl.searchParams.get("precio") || "24900")
  const base = req.nextUrl.searchParams.get("periodoBase") || getCatalogPriceBasePeriod()

  if (!Number.isFinite(precio) || precio < 0) {
    return NextResponse.json({ error: "precio inválido" }, { status: 400 })
  }

  const result = indexarPrecioCatalogo(precio, base)
  return NextResponse.json({
    success: true,
    indexacion: result,
    nota:
      "Activá CLAVER_INDEXAR_PRECIOS=1 en el entorno para aplicar el factor en checkout real. Tope y base configurables.",
  })
}

const postSchema = z.object({
  precios: z.array(z.number()),
  periodoBase: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const ctx = await getAuthContext(req)
  if (!ctx.ok) return ctx.response

  const body = await req.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const base = parsed.data.periodoBase || getCatalogPriceBasePeriod()
  const items = parsed.data.precios.map((p) => indexarPrecioCatalogo(p, base))
  return NextResponse.json({ success: true, items, periodoBase: base })
}
