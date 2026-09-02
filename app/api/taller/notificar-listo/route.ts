import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { TallerMecanicoService } from "@/lib/taller/taller-mecanico-service"

const tallerService = new TallerMecanicoService()

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const { ordenId } = await request.json()
    if (!ordenId) {
      return NextResponse.json({ error: "ordenId requerido" }, { status: 400 })
    }

    const notificacion = await tallerService.generarMensajeAutoListo(auth.auth.empresaId, Number(ordenId))
    return NextResponse.json({ ok: true, ...notificacion })
  } catch (error) {
    console.error("[POST /api/taller/notificar-listo] Error:", error)
    return NextResponse.json({ error: "Error generando aviso de auto listo" }, { status: 500 })
  }
}
