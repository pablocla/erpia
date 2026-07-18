import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { listarDeudoresFiado } from "@/lib/fiado/fiado-service"
import { canUseSku } from "@/lib/platform/entitlements"

export async function GET(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const isLicensed = await canUseSku(ctx.auth.empresaId, "pos.fiado_barrio")
  if (!isLicensed.ok) return NextResponse.json({ error: "SKU_REQUIRED" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const todos = searchParams.get("todos") === "1"

  const data = await listarDeudoresFiado(ctx.auth.empresaId, !todos)

  return NextResponse.json({ data })
}