import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystEmpresaContext } from "@/lib/auth/claver-analyst"
import { getTenantBilling } from "@/lib/ops/tenant-billing-service"
import { getTenantPlan, setTenantPlan, TENANT_PLAN_LIMITS, type TenantPlanId } from "@/lib/ops/tenant-plan-service"

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

    const [billing, plan] = await Promise.all([getTenantBilling(id), getTenantPlan(id)])
    return NextResponse.json({ billing, plan, planes: TENANT_PLAN_LIMITS })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    const status = msg.includes("no encontrada") ? 404 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

const patchSchema = z.object({
  plan: z.enum(["Starter", "Pro", "Enterprise"]),
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
      return NextResponse.json({ error: "plan inválido (Starter | Pro | Enterprise)" }, { status: 400 })
    }

    const plan = await setTenantPlan(id, parsed.data.plan as TenantPlanId)
    const billing = await getTenantBilling(id)
    return NextResponse.json({ plan, billing })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}