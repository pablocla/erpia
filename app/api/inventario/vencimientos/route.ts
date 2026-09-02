import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { obtenerAlertasVencimiento } from "@/lib/inventario/vencimientos-service"

/**
 * GET /api/inventario/vencimientos
 * Devuelve el semáforo y lista de productos perecederos ordenados por vencimiento.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const data = await obtenerAlertasVencimiento(auth.auth.empresaId)
    return NextResponse.json({ ok: true, ...data })
  } catch (error) {
    console.error("[GET /api/inventario/vencimientos] Error:", error)
    return NextResponse.json({ error: "Error obteniendo alertas de vencimiento" }, { status: 500 })
  }
}
