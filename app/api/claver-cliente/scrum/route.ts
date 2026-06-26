import { type NextRequest, NextResponse } from "next/server"
import { getStakeholderContext } from "@/lib/auth/stakeholder-guard"
import { getScrumResumenStakeholder } from "@/lib/ops/scrum-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getStakeholderContext(request)
    if (!ctx.ok) return ctx.response
    const resumen = await getScrumResumenStakeholder(ctx.auth.empresaId)
    return NextResponse.json(resumen)
  } catch (error) {
    console.error("Error portal scrum:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}