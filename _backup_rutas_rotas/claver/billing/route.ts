import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getFleetBilling } from "@/lib/ops/tenant-billing-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const billing = await getFleetBilling(ctx.auth.email)
    return NextResponse.json(billing)
  } catch (error) {
    console.error("Error fleet billing:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}