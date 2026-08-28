import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import {
  countPendientesUpgradeArca,
  listPendientesUpgradeArca,
} from "@/lib/comercial/implementacion-arca"

export async function GET(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const [pendientes, total] = await Promise.all([
      listPendientesUpgradeArca(),
      countPendientesUpgradeArca(),
    ])
    return NextResponse.json({
      ok: true,
      total,
      pendientes,
    })
  } catch (error) {
    console.error("Error listando upgrades ARCA:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
