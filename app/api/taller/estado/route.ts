import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { TallerMecanicoService } from "@/lib/taller/taller-mecanico-service"

const tallerService = new TallerMecanicoService()

export async function PUT(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const { ordenId, estado } = await request.json()
    if (!ordenId || !estado) {
      return NextResponse.json({ error: "ordenId y estado son requeridos" }, { status: 400 })
    }

    const orden = await tallerService.actualizarEstado(auth.auth.empresaId, Number(ordenId), estado)
    return NextResponse.json({ ok: true, orden })
  } catch (error) {
    console.error("[PUT /api/taller/estado] Error:", error)
    return NextResponse.json({ error: "Error actualizando estado de la orden" }, { status: 500 })
  }
}
