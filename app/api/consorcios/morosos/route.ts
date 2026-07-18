import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  avisarMorosoExpensa,
  linkPagoExpensa,
  listarMorososExpensas,
} from "@/lib/consorcios/consorcios-morosos-service"
import { cobrarExpensa } from "@/lib/consorcios/consorcios-cobro-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const consorcioId = request.nextUrl.searchParams.get("consorcioId")
  const rows = await listarMorososExpensas(
    auth.auth.empresaId,
    consorcioId ? Number(consorcioId) : undefined,
  )
  return NextResponse.json(rows)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const expensaId = Number(body.expensaId)
  if (!expensaId) {
    return NextResponse.json({ error: "expensaId requerido" }, { status: 400 })
  }

  const action = (body.action as string) || "avisar"

  if (action === "cobrar") {
    const result = await cobrarExpensa(auth.auth.empresaId, expensaId, {
      monto: body.monto != null ? Number(body.monto) : undefined,
      medioPago: body.medioPago,
      observaciones: body.observaciones,
    })
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result)
  }

  if (action === "link_pago") {
    const result = await linkPagoExpensa(auth.auth.empresaId, expensaId)
    if (!result.ok) {
      return NextResponse.json({ error: result.motivo ?? "Sin link" }, { status: 400 })
    }
    return NextResponse.json(result)
  }

  const result = await avisarMorosoExpensa(auth.auth.empresaId, expensaId)
  if (!result.ok) {
    return NextResponse.json({ error: result.motivo ?? "No se pudo avisar" }, { status: 400 })
  }
  return NextResponse.json({ ok: true, linkPago: result.linkPago ?? null })
}
