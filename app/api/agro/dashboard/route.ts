import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { agroService } from "@/lib/agro/agro-service"

/** Dashboard AGRO: KPIs + pizarra + stock */
export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const resumen = await agroService.resumenDashboard(auth.auth.empresaId)
  return NextResponse.json(resumen)
}
