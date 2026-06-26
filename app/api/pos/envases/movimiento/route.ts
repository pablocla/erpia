import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canUseSku } from "@/lib/platform/entitlements"
import { registrarMovimientoEnvasePos } from "@/lib/almacen-rosario/envase-pos-service"

const schema = z.object({
  tipoEnvaseId: z.number().int().positive(),
  tipo: z.enum(["entrega", "retorno"]),
  cantidad: z.number().int().min(1),
  clienteId: z.number().int().positive().optional(),
  observaciones: z.string().max(500).optional(),
  cobrarDeposito: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const acceso = await canUseSku(ctx.auth.empresaId, "pos.envases_gaseosas")
    if (!acceso.ok) {
      return NextResponse.json({ error: "Envases de gaseosas no activo" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const result = await registrarMovimientoEnvasePos({
      empresaId: ctx.auth.empresaId,
      ...parsed.data,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error movimiento envase POS:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 },
    )
  }
}