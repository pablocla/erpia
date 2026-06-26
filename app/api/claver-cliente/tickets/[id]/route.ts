import { type NextRequest, NextResponse } from "next/server"
import { getStakeholderContext } from "@/lib/auth/stakeholder-guard"
import { getStakeholderTicketDetalle } from "@/lib/ops/client-portal-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getStakeholderContext(request)
    if (!ctx.ok) return ctx.response
    const { id } = await params
    const ticket = await getStakeholderTicketDetalle(ctx.auth.empresaId, Number(id))
    if (!ticket) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Error ticket stakeholder:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}