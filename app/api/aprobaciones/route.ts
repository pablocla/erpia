import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  crearSolicitudAprobacion,
  procesarAprobacion,
  listarPendientes,
} from "@/lib/aprobaciones/aprobaciones-service"
import { prisma } from "@/lib/prisma"

// GET — Listar solicitudes pendientes (opcionalmente por rol)
export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!(await auth).ok) return (await auth).response
  const { auth: ctx } = await auth as { ok: true; auth: { empresaId: number; rol: string } }

  const rol = request.nextUrl.searchParams.get("rol") ?? undefined
  const solicitudes = await listarPendientes(ctx.empresaId, rol)
  return NextResponse.json({ success: true, data: solicitudes })
}

// POST — Crear solicitud o procesar aprobación
export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const body = await request.json()

  // Si viene solicitudId → es una acción de aprobar/rechazar
  if (body.solicitudId) {
    const resultado = await procesarAprobacion({
      solicitudId: body.solicitudId,
      aprobadorId: auth.userId,
      accion: body.accion,
      comentario: body.comentario,
      empresaId: auth.empresaId,
    })
    return NextResponse.json({ success: true, data: resultado })
  }

  // Sino → crear nueva solicitud
  const resultado = await crearSolicitudAprobacion({
    empresaId: auth.empresaId,
    entidad: body.entidad,
    entidadId: body.entidadId,
    monto: body.monto,
    solicitanteId: auth.userId,
    descripcion: body.descripcion,
  })
  return NextResponse.json({ success: true, data: resultado }, { status: 201 })
}
