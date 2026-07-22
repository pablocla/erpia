import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { ejecutarAccionProductoTenant } from "@/lib/ops/tenant-admin-service"

const schema = z.object({
  action: z.enum([
    "provision",
    "activate",
    "deactivate",
    "provision_pack",
    "activate_pack",
    "deactivate_pack",
  ]),
  sku: z.string().optional(),
  packId: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ empresaId: string }> },
) {
  try {
    const { empresaId } = await params
    const id = Number(empresaId)
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "empresaId inválido" }, { status: 400 })
    }

    const ctx = await getClaverAnalystEmpresaContext(request, id)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const result = await ejecutarAccionProductoTenant(id, parsed.data, ctx.auth.email)
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}