import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { listarPendientesPorRol } from "@/lib/pendientes/pendientes-service"

/**
 * GET /api/pendientes?rol=cajero
 * Bandeja de pendientes del sistema + tareas manuales del usuario autenticado.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { searchParams } = new URL(request.url)
    const rolParam = searchParams.get("rol")
    const rol = rolParam ?? ctx.auth.rol

    const pendientes = await listarPendientesPorRol(
      ctx.auth.empresaId,
      rol,
      ctx.auth.userId
    )

    const sistema = pendientes.filter((p) => p.origen === "sistema")
    const manual = pendientes.filter((p) => p.origen === "manual")

    return NextResponse.json({
      rol,
      total: pendientes.length,
      sistema: sistema.length,
      manual: manual.length,
      pendientes,
    })
  } catch (error) {
    console.error("Error en /api/pendientes:", error)
    return NextResponse.json({ error: "Error al obtener pendientes" }, { status: 500 })
  }
}