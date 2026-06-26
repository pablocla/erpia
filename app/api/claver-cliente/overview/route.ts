import { type NextRequest, NextResponse } from "next/server"
import { getStakeholderContext } from "@/lib/auth/stakeholder-guard"
import { getClientPortalOverview } from "@/lib/ops/client-portal-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getStakeholderContext(request)
    if (!ctx.ok) return ctx.response
    const data = await getClientPortalOverview(ctx.auth.empresaId)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error portal overview:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}