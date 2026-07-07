import { type NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { getDashboard } from "@/lib/reporting/dashboards-service"

function getEncodedSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "dev-pos-system-argentina-2025-unsafe"
  return new TextEncoder().encode(secret)
}

export async function GET(request: NextRequest) {
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
    
    const dashboard = await getDashboard(dashboardId, empresaId)
    if (!dashboard) throw new Error("Dashboard no encontrado")
    
    // Solo devolvemos datos seguros (sin layout completo si no hace falta, pero widgets sí)
    return NextResponse.json({
      nombre: dashboard.nombre,
      descripcion: dashboard.descripcion,
      widgets: dashboard.widgets
    })
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Token inválido o expirado" }, { status: 401 })
  }
}
