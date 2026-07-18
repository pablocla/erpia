import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getCommandCenter } from "@/lib/ops/command-center-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const data = await getCommandCenter(ctx.auth.email)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error command center:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}