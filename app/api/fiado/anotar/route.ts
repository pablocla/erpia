import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { anotarFiadoLibreta } from "@/lib/fiado/fiado-service"
import { canUseSku } from "@/lib/platform/entitlements"
import { canWriteSku } from "@/lib/comercial/comercial-access-service"

export async function POST(request: NextRequest) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const empresaId = ctx.auth.empresaId
  const licensed = await canUseSku(empresaId, "pos.fiado_barrio")
  if (!licensed.ok) {
    return NextResponse.json({ error: "SKU_REQUIRED", message: licensed.reason }, { status: 403 })
  }

  const puedeEscribir = await canWriteSku(empresaId, "pos.fiado_barrio")
  if (!puedeEscribir) {
    return NextResponse.json(
      { error: "WRITE_BLOCKED", message: "Tu plan no permite anotar fiados en este momento." },
      { status: 403 },
    )
  }

  const body = await request.json().catch(() => ({}))
  const clienteId = Number(body.clienteId)
  const monto = Number(body.monto)
  if (!clienteId || !Number.isFinite(monto)) {
    return NextResponse.json({ error: "clienteId y monto son obligatorios" }, { status: 400 })
  }

  const result = await anotarFiadoLibreta({
    empresaId,
    clienteId,
    monto,
    concepto: typeof body.concepto === "string" ? body.concepto : undefined,
    diasVencimiento: body.diasVencimiento != null ? Number(body.diasVencimiento) : 0,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result, { status: 201 })
}
