import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { executeReport } from "@/lib/reporting/engine/query-engine"
import { getDashboard } from "@/lib/reporting/dashboards-service"
import { getReportDefinition } from "@/lib/reporting/definitions-service"
import { getEncodedJwtSecret } from "@/lib/auth/jwt-secret"

function getEncodedSecret(): Uint8Array {
  return getEncodedJwtSecret()
}

export async function POST(request: NextRequest) {
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
    
    const body = await request.json()
    const { definition, smartViewId } = body
    
    if (!definition || !smartViewId) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 })
    }

    // Validate dashboard exists
    const dashboard = await getDashboard(dashboardId, empresaId)
    if (!dashboard) throw new Error("Dashboard no encontrado")
    
    // Check if the requested smartViewId is part of the dashboard widgets
    const widgets = (dashboard.widgets as any[]) ?? []
    const isWidgetInDashboard = widgets.some(w => Number(w.smartViewId) === Number(smartViewId))
    
    if (!isWidgetInDashboard) {
      return NextResponse.json({ error: "No autorizado para ejecutar este reporte" }, { status: 403 })
    }

    // Verify source hasn't been tampered with
    const originalDef = await getReportDefinition(Number(smartViewId), empresaId)
    if (!originalDef || (originalDef.definicion as any).fuente !== definition.fuente) {
      return NextResponse.json({ error: "Fuente modificada no permitida" }, { status: 403 })
    }

    const data = await executeReport(definition, empresaId, "admin") // admin role is used to bypass field-level restrictions since this is a public dashboard authorized by the admin.
    return NextResponse.json(data)
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Token inválido o expirado" }, { status: 401 })
  }
}
