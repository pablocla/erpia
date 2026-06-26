import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { provisionSku } from "@/lib/marketplace/provision-service"

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const { sku } = await request.json()
    if (!sku) {
      return NextResponse.json({ error: "SKU requerido" }, { status: 400 })
    }

    const result = await provisionSku(auth.auth.empresaId, sku, {
      iniciadoPor: auth.auth.email,
    })

    return NextResponse.json({
      success: true,
      ...result,
      message: result.auto
        ? `Provisión automática iniciada para ${result.nombre}`
        : `Tarea de analista creada para ${result.nombre}`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error interno"
    const status = message.includes("no encontrado") ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}