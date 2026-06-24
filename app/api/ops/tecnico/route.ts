import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canAccessClientOps } from "@/lib/auth/claver-analyst"
import { getDatosTecnicosTenant, rotateWebhookSecret } from "@/lib/ops/ops-tecnico-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    if (!canAccessClientOps(ctx.auth.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const data = await getDatosTecnicosTenant(ctx.auth.empresaId)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error ops tecnico:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    if (!canAccessClientOps(ctx.auth.rol)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    }

    const body = await request.json()
    const { action, codigo } = body
    if (action !== "rotate-webhook" || !codigo) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
    }

    const result = await rotateWebhookSecret(ctx.auth.empresaId, codigo)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error al rotar webhook:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}