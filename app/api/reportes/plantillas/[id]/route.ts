import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { plantillasReportesService } from "@/lib/reportes/plantillas-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response
  if (ctx.auth.rol !== "administrador") return NextResponse.json({ error: "Solo administradores pueden ver plantillas" }, { status: 403 })

  const { id } = await params
  const plantilla = await plantillasReportesService.obtener(Number(id), ctx.auth.empresaId)
  if (!plantilla) return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 })

  return NextResponse.json({ plantilla })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response
  if (ctx.auth.rol !== "administrador") return NextResponse.json({ error: "Solo administradores pueden editar plantillas" }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { codigo, nombre, descripcion, tipo, motor, contenido, orden, activo } = body

  const plantilla = await plantillasReportesService.actualizar(Number(id), {
    codigo,
    nombre,
    descripcion,
    tipo,
    motor,
    contenido,
    orden,
    activo,
  })

  return NextResponse.json({ plantilla })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response
  if (ctx.auth.rol !== "administrador") return NextResponse.json({ error: "Solo administradores pueden eliminar plantillas" }, { status: 403 })

  const { id } = await params
  await plantillasReportesService.eliminar(Number(id))
  return NextResponse.json({ ok: true })
}
