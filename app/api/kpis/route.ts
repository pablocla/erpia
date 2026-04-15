import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { calcularKPIs, guardarSnapshotDiario } from "@/lib/kpis/kpi-service"

// GET — Calcular KPIs en tiempo real
export async function GET(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const kpis = await calcularKPIs(auth.empresaId)
  return NextResponse.json({ success: true, data: kpis })
}

// POST — Guardar snapshot diario (para cron)
export async function POST(request: NextRequest) {
  const authResult = await getAuthContext(request)
  if (!authResult.ok) return authResult.response
  const { auth } = authResult

  const resultado = await guardarSnapshotDiario(auth.empresaId)
  return NextResponse.json({ success: true, data: resultado })
}
