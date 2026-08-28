import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { listWebRegistrations } from "@/lib/ops/web-registrations-service"

export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  const { searchParams } = new URL(request.url)
  const take = searchParams.get("take") ? parseInt(searchParams.get("take")!, 10) : 100
  const origen = (searchParams.get("origen") as any) || undefined

  try {
    const data = await listWebRegistrations(ctx.auth.email, { take, origen })
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Error obteniendo registros web" }, { status: 500 })
  }
}
