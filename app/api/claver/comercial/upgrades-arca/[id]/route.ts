import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { resolverUpgradeArca } from "@/lib/comercial/implementacion-arca"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const leadId = Number(id)
    if (!Number.isFinite(leadId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const accion = body.accion as "atender" | "descartar"
    if (accion !== "atender" && accion !== "descartar") {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
    }

    const lead = await resolverUpgradeArca(leadId, accion)
    if (!lead) {
      return NextResponse.json({ error: "Pendiente no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ ok: true, lead })
  } catch (error) {
    console.error("Error resolviendo upgrade ARCA:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
