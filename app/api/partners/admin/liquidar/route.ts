import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { isClaverAnalyst } from "@/lib/auth/claver-analyst"
import { liquidarComisiones } from "@/lib/partners/partner-wallet-service"

/**
 * POST /api/partners/admin/liquidar
 * Compat: admin tenant o analista. Preferir /api/claver/partners/liquidaciones
 */
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const rol = auth.auth.rol
  const analyst = isClaverAnalyst(auth.auth.email, rol)
  if (rol !== "administrador" && rol !== "admin" && !analyst) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const partnerId = Number(body.partnerId)
    const ids = Array.isArray(body.comisionIds)
      ? body.comisionIds.map(Number).filter((n: number) => Number.isFinite(n))
      : []

    if (!partnerId && ids.length === 0) {
      return NextResponse.json(
        { error: "partnerId o comisionIds requerido" },
        { status: 400 },
      )
    }

    const result = await liquidarComisiones({
      partnerId: partnerId || undefined,
      comisionIds: ids.length ? ids : undefined,
      nota: `admin:${auth.auth.email}`,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error("[partners/admin/liquidar]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    )
  }
}
