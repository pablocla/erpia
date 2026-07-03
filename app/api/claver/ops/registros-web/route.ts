import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { listWebRegistrations } from "@/lib/ops/web-registrations-service"
import { extendTrialDays } from "@/lib/ops/signup-tracking"

const origenEnum = z.enum([
  "web_register",
  "industry_demo",
  "provisioning",
  "relevamiento",
  "manual",
])

export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const origenParam = request.nextUrl.searchParams.get("origen")
  const origenParsed = origenParam ? origenEnum.safeParse(origenParam) : null
  const take = Number(request.nextUrl.searchParams.get("take") ?? "100")

  const data = await listWebRegistrations(ctx.auth.email, {
    take: Number.isFinite(take) ? take : 100,
    origen: origenParsed?.success ? origenParsed.data : undefined,
  })

  return NextResponse.json({ success: true, ...data })
}

export async function PATCH(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const body = await request.json().catch(() => ({}))
  const empresaId = Number(body.empresaId)
  const action = body.action as string

  if (!empresaId) {
    return NextResponse.json({ error: "empresaId requerido" }, { status: 400 })
  }

  if (action === "extend_trial") {
    const dias = Number(body.dias ?? 7)
    const trial = await extendTrialDays(empresaId, dias)
    return NextResponse.json({ success: true, trial })
  }

  return NextResponse.json({ error: "Acción no soportada" }, { status: 400 })
}