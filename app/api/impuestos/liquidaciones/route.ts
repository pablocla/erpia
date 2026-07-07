import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { LiquidacionImpuestoService } from "@/lib/impuestos/liquidacion-impuesto-service"
import { z } from "zod"

const liquidacionSchema = z.object({
  tipo: z.enum(["iva", "iibb", "sicore"]),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Debe ser YYYY-MM"),
  totales: z.record(z.any())
})

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const periodo = request.nextUrl.searchParams.get("periodo") || undefined
    const svc = new LiquidacionImpuestoService()
    const liquidaciones = await svc.obtenerLiquidaciones(auth.auth.empresaId, periodo)

    return NextResponse.json({ success: true, liquidaciones })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const parsed = liquidacionSchema.parse(body)

    const svc = new LiquidacionImpuestoService()
    const nueva = await svc.guardarLiquidacion(auth.auth.empresaId, parsed.tipo, parsed.periodo, parsed.totales)

    return NextResponse.json({ success: true, liquidacion: nueva })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
