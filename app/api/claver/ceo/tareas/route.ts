import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getTareaByCodigo } from "@/lib/ops/ceo-roadmap-catalog"
import { toggleCeoTarea } from "@/lib/ops/ceo-task-service"

export async function PATCH(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const { codigo, completada } = body as { codigo?: string; completada?: boolean }

    if (!codigo?.trim() || typeof completada !== "boolean") {
      return NextResponse.json({ error: "codigo y completada son obligatorios" }, { status: 400 })
    }

    if (!getTareaByCodigo(codigo)) {
      return NextResponse.json({ error: "Tarea no encontrada en catálogo" }, { status: 404 })
    }

    await toggleCeoTarea(ctx.auth.email, codigo, completada)
    return NextResponse.json({ ok: true, codigo, completada })
  } catch (error) {
    console.error("Error CEO tarea:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}