import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { obtenerGruposPosCatalogo } from "@/lib/pos/pos-catalogo-grupos"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const data = await obtenerGruposPosCatalogo(ctx.auth.empresaId)
  return NextResponse.json(data)
}