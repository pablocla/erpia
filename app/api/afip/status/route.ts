import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { obtenerEstadoAfipPos } from "@/lib/pos/pos-afip-status"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const status = await obtenerEstadoAfipPos(ctx.auth.empresaId)
  return NextResponse.json(status)
}