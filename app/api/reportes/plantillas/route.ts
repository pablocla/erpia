import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { plantillasReportesService } from "@/lib/reportes/plantillas-service"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response
  if (ctx.auth.rol !== "administrador") return NextResponse.json({ error: "Solo administradores pueden listar plantillas" }, { status: 403 })

  const plantillas = await plantillasReportesService.listar(ctx.auth.empresaId)
  return NextResponse.json({ plantillas, total: plantillas.length })
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response
  if (ctx.auth.rol !== "administrador") return NextResponse.json({ error: "Solo administradores pueden crear plantillas" }, { status: 403 })

  const body = await request.json()
  const { codigo, nombre, descripcion, tipo, motor, contenido, orden } = body
  if (!codigo || !nombre || !tipo || !motor || !contenido) {
    return NextResponse.json({ error: "codigo, nombre, tipo, motor y contenido son requeridos" }, { status: 400 })
  }

  const plantilla = await plantillasReportesService.crear(
    { codigo, nombre, descripcion, tipo, motor, contenido, orden },
    ctx.auth.empresaId,
  )

  return NextResponse.json({ plantilla }, { status: 201 })
}
