import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  activarCobranzaAsAService,
  desactivarCobranzaAsAService,
  resumenCobranzaAsAService,
} from "@/lib/cobranza/as-a-service"
import { resumenCobranzasPendientes } from "@/lib/marketplace/cobranzas-wa-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const [resumen, pendientes] = await Promise.all([
      resumenCobranzaAsAService(auth.auth.empresaId),
      resumenCobranzasPendientes(auth.auth.empresaId, 7),
    ])
    return NextResponse.json({ ...resumen, pendientes })
  } catch (err) {
    console.error("[cobranza-aas GET]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json().catch(() => ({}))
    if (body.action === "activar") {
      const config = await activarCobranzaAsAService(auth.auth.empresaId, {
        feePct: body.feePct != null ? Number(body.feePct) : undefined,
        feeMinArs: body.feeMinArs != null ? Number(body.feeMinArs) : undefined,
        autoAprobarWa: Boolean(body.autoAprobarWa),
        diasVencimiento: body.diasVencimiento != null ? Number(body.diasVencimiento) : undefined,
      })
      return NextResponse.json({ ok: true, config })
    }
    if (body.action === "desactivar") {
      await desactivarCobranzaAsAService(auth.auth.empresaId)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: "action inválida" }, { status: 400 })
  } catch (err) {
    console.error("[cobranza-aas POST]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    )
  }
}
