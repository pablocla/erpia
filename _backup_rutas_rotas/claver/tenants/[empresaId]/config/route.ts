import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { getTenantConfigCloud, patchTenantConfigCloud } from "@/lib/ops/tenant-config-cloud-service"

export async function GET(
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

    const config = await getTenantConfigCloud(id)
    return NextResponse.json(config)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    const status = msg.includes("no encontrada") ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

const patchSchema = z.object({
  empresa: z
    .object({
      nombre: z.string().optional(),
      razonSocial: z.string().optional(),
      cuit: z.string().optional(),
      puntoVenta: z.number().int().optional(),
      rubro: z.string().optional(),
      condicionIva: z.string().optional(),
      email: z.string().optional(),
      telefono: z.string().optional(),
    })
    .optional(),
  feature: z
    .object({
      featureKey: z.string().min(1),
      activado: z.boolean(),
    })
    .optional(),
})

export async function PATCH(
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
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    const config = await patchTenantConfigCloud(id, parsed.data, ctx.auth.email)
    return NextResponse.json(config)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}