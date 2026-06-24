import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { cotizarMultiCarrier } from "@/lib/logistica/shipping-orchestrator"

const Schema = z.object({
  cpOrigen: z.string().min(4),
  cpDestino: z.string().min(4),
  pesoKg: z.number().positive(),
  bultos: z.number().int().positive().optional(),
  valorDeclarado: z.number().positive().optional(),
  carriers: z.array(z.enum(["andreani", "oca", "correo_argentino"])).optional(),
})

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const cotizaciones = await cotizarMultiCarrier({
    empresaId: ctx.auth.empresaId,
    ...parsed.data,
  })

  return NextResponse.json({
    success: true,
    cotizaciones,
    recomendada: cotizaciones[0] ?? null,
  })
}