import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getRelevamiento } from "@/lib/ops/comercial-relevamiento-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const row = await getRelevamiento(Number(id))
    if (!row) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    return NextResponse.json(row)
  } catch (error) {
    console.error("Error obteniendo relevamiento:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}