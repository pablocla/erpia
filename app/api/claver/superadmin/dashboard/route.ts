import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getSuperAdminFleetDashboard } from "@/lib/ops/superadmin-dashboard-service"

export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const data = await getSuperAdminFleetDashboard(ctx.auth.email)
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Error obteniendo superadmin dashboard" }, { status: 500 })
  }
}
