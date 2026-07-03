import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getNicheApp } from "@/lib/niche/niche-apps-catalog"
import { listarMorososCuota } from "@/lib/niche/cuotas-service"
import { listarMovimientosNiche } from "@/lib/niche/movimientos-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> },
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { appId } = await params
  const app = getNicheApp(appId)
  if (!app) return NextResponse.json({ error: "App no encontrada" }, { status: 404 })

  if (app.engine === "cuotas") {
    const morosos = await listarMorososCuota(auth.auth.empresaId, app.sku)
    return NextResponse.json({ morosos })
  }

  const morosos = await listarMovimientosNiche(auth.auth.empresaId, app.sku, {
    estado: "pendiente",
  })
  return NextResponse.json({ morosos })
}