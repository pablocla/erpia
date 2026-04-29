import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { reportesService } from "@/lib/reportes/report-service"

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response
  if (ctx.auth.rol !== "administrador") return NextResponse.json({ error: "Solo administradores pueden renderizar reportes" }, { status: 403 })

  const body = await request.json()
  const { plantillaId, parametros = {} } = body
  if (!plantillaId) {
    return NextResponse.json({ error: "plantillaId es requerido" }, { status: 400 })
  }

  try {
    const resultado = await reportesService.render(Number(plantillaId), parametros, ctx.auth.empresaId)
    return NextResponse.json({ ok: true, ...resultado })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
