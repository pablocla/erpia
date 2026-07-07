import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getReportDefinition } from "@/lib/reporting/definitions-service"
import { getDashboard } from "@/lib/reporting/dashboards-service"

function getEncodedSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "dev-pos-system-argentina-2025-unsafe"
  return new TextEncoder().encode(secret)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Public Bearer ")) {
    return NextResponse.json({ error: "Token público no proporcionado" }, { status: 401 })
  }

  const token = authHeader.substring(14)
  
  try {
    const { payload } = await jwtVerify(token, getEncodedSecret())
    if (payload.rol !== "public_viewer") throw new Error("Rol inválido")
    
    const dashboardId = Number(payload.dashboardId)
    const empresaId = Number(payload.empresaId)
    
    const { id: smartViewId } = await params
    
    // Validate dashboard exists
    const dashboard = await getDashboard(dashboardId, empresaId)
    if (!dashboard) throw new Error("Dashboard no encontrado")
    
    // Check if the requested smartViewId is part of the dashboard widgets
    const widgets = (dashboard.widgets as any[]) ?? []
    const isWidgetInDashboard = widgets.some(w => Number(w.smartViewId) === Number(smartViewId))
    
    if (!isWidgetInDashboard) {
      return NextResponse.json({ error: "No autorizado para ver este reporte" }, { status: 403 })
    }

    const definition = await getReportDefinition(Number(smartViewId), empresaId)
    if (!definition) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    return NextResponse.json(definition)
    
  } catch (err) {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
  }
}
