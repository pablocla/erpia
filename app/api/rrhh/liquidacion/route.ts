import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { liquidacionSueldos } from "@/lib/rrhh/empleados-service"

export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response

  const { searchParams } = new URL(request.url)
  const periodo = searchParams.get("periodo") || new Date().toISOString().slice(0, 7)

  const resultado = await liquidacionSueldos(authResult.auth.empresaId, periodo)
  return NextResponse.json({ success: true, liquidez: resultado })
}
