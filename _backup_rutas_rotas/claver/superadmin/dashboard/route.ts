import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getSuperAdminFleetDashboard } from "@/lib/ops/superadmin-dashboard-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const dashboard = await getSuperAdminFleetDashboard(ctx.auth.email)
    return NextResponse.json(dashboard)
  } catch (error) {
    console.error("Error superadmin dashboard:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}