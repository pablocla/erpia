import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import {
  listPartnersLiquidacion,
  liquidarComisiones,
} from "@/lib/partners/partner-wallet-service"

/**
 * GET  — cola de partners con saldo pendiente/solicitado
 * POST — liquidar cash (marca solicitado → liquidado tras transferencia real)
 */
export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const partners = await listPartnersLiquidacion()
    const totalSolicitado = partners.reduce((s, p) => s + p.solicitado, 0)
    const totalPendiente = partners.reduce((s, p) => s + p.pendiente, 0)
    return NextResponse.json({
      ok: true,
      partners,
      summary: {
        partners: partners.length,
        totalSolicitado,
        totalPendiente,
        message:
          "Pagá por transferencia el 'solicitado' y marcá liquidar. El 'pendiente' el partner puede usarlo como crédito Claver (más rentable).",
      },
    })
  } catch (e) {
    console.error("[claver/partners/liquidaciones GET]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const body = await request.json().catch(() => ({}))
    const result = await liquidarComisiones({
      partnerId: body.partnerId != null ? Number(body.partnerId) : undefined,
      comisionIds: Array.isArray(body.comisionIds)
        ? body.comisionIds.map(Number).filter((n: number) => Number.isFinite(n))
        : undefined,
      nota: typeof body.nota === "string" ? body.nota : `analista:${ctx.auth.email}`,
    })
    return NextResponse.json({ ok: true, ...result, by: ctx.auth.email })
  } catch (e) {
    console.error("[claver/partners/liquidaciones POST]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error liquidando" },
      { status: 500 },
    )
  }
}
