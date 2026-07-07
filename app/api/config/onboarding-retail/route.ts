import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { z } from "zod"
import { applyRetailOnboarding } from "@/lib/comercial/retail-onboarding-service"
import { engancheParaRubro } from "@/lib/comercial/pack-calle-catalog"

const productSchema = z.object({
  nombre: z.string().min(1),
  codigo: z.string().optional(),
  precioVenta: z.number().positive(),
  codigoBarras: z.string().optional(),
})

const onboardingSchema = z.object({
  rubro: z.string().min(1),
  modoLite: z.enum(["fiado", "cobranza", "pos", "completo", "niche"]),
  engancheId: z.string().optional(),
  productos: z.array(productSchema).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const validacion = onboardingSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { rubro, modoLite, engancheId, productos: userProducts } = validacion.data

    const result = await applyRetailOnboarding({
      empresaId: ctx.auth.empresaId,
      rubro,
      modoLite,
      engancheId: engancheId ?? engancheParaRubro(rubro),
      productos: userProducts?.map((p) => ({
        nombre: p.nombre,
        precioVenta: p.precioVenta,
        codigoBarras: p.codigoBarras,
      })),
      origen: "onboarding_retail_ui",
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error: unknown) {
    console.error("Error en onboarding retail API:", error)
    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
