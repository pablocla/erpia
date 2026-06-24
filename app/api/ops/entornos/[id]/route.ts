import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canAccessClientOps } from "@/lib/auth/claver-analyst"
import { cambiarEstadoEntorno } from "@/lib/ops/ops-service"

const schema = z.object({
  estado: z.enum(["activo", "mantenimiento", "detenido", "error", "desplegando"]),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!canAccessClientOps(ctx.auth.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const { id } = await params
    const entornoId = Number(id)
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    const entorno = await cambiarEstadoEntorno(
      ctx.auth.empresaId,
      entornoId,
      parsed.data.estado,
      ctx.auth.email,
    )

    return NextResponse.json(entorno)
  } catch (error) {
    console.error("Error actualizar entorno:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}