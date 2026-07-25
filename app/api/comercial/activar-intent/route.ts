import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { applyActivarIntent } from "@/lib/comercial/activar-producto-service"

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    if (!body.activar || typeof body.activar !== "string") {
      return NextResponse.json({ error: "Falta parámetro 'activar'" }, { status: 400 })
    }

    const result = await applyActivarIntent({
      empresaId: auth.auth.empresaId,
      activar: body.activar,
      origen: body.origen ?? "api_activar_intent",
    })

    return NextResponse.json({
      success: true,
      landingPath: result.landingPath,
      modoLite: result.modoLite,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Error al activar producto" },
      { status: 400 },
    )
  }
}
