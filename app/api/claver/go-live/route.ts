import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import {
  COMMERCIAL_GO_LIVE_ITEMS,
  getCommercialChecklist,
  getTosAcceptance,
  listTenantsGoLiveQueue,
  toggleChecklistItem,
} from "@/lib/ops/commercial-go-live-checklist"
import { getEmpresaReadiness } from "@/lib/ops/readiness-service"
import { GO_LIVE_PACKS_PRD, GO_LIVE_PACKS_PILOTO } from "@/lib/comercial/go-live-packs"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET /api/claver/go-live
 *   ?empresaId=N → detalle tenant
 *   sin query → cola Oleada 0
 *
 * POST body: { empresaId, itemId, done, note?, packId? }
 */
export async function GET(request: NextRequest) {
  const ctx = await getClaverAnalystContext(request)
  if (!ctx.ok) return ctx.response

  try {
    const empresaId = Number(request.nextUrl.searchParams.get("empresaId"))
    if (empresaId > 0) {
      const [empresa, checklist, readiness, tos] = await Promise.all([
        prisma.empresa.findUnique({
          where: { id: empresaId },
          select: {
            id: true,
            nombre: true,
            email: true,
            rubro: true,
            cuit: true,
            mpSubscriptionStatus: true,
            modoLite: true,
          },
        }),
        getCommercialChecklist(empresaId),
        getEmpresaReadiness(empresaId),
        getTosAcceptance(empresaId),
      ])
      if (!empresa) {
        return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
      }
      return NextResponse.json({
        empresa,
        checklist,
        catalog: COMMERCIAL_GO_LIVE_ITEMS,
        readiness,
        tos,
        packsPrd: GO_LIVE_PACKS_PRD,
        packsPiloto: GO_LIVE_PACKS_PILOTO,
      })
    }

    const queue = await listTenantsGoLiveQueue(40)
    return NextResponse.json({
      ...queue,
      catalog: COMMERCIAL_GO_LIVE_ITEMS,
      packsPrd: GO_LIVE_PACKS_PRD,
      packsPiloto: GO_LIVE_PACKS_PILOTO,
    })
  } catch (e) {
    console.error("[claver/go-live GET]", e)
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
    const empresaId = Number(body.empresaId)
    const itemId = typeof body.itemId === "string" ? body.itemId : ""
    if (!empresaId || !itemId) {
      return NextResponse.json({ error: "empresaId e itemId requeridos" }, { status: 400 })
    }
    const done = Boolean(body.done)
    const state = await toggleChecklistItem({
      empresaId,
      itemId,
      done,
      by: ctx.auth.email,
      note: typeof body.note === "string" ? body.note : undefined,
      packId: typeof body.packId === "string" ? body.packId : undefined,
    })
    return NextResponse.json({ ok: true, checklist: state })
  } catch (e) {
    console.error("[claver/go-live POST]", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    )
  }
}
