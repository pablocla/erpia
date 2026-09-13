import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { markSenaPaid } from "@/lib/works/works-service"

type Ctx = { params: Promise<{ id: string }> }

/** Manual seña OK (PRD §8.E / §9) — does not require MP reconciliation */
export async function POST(request: NextRequest, context: Ctx) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  try {
    const body = await request.json().catch(() => ({}))
    const project = await markSenaPaid(id, {
      monto: body.monto != null ? Number(body.monto) : undefined,
      nota: body.nota ?? "seña manual",
    })
    return NextResponse.json({ ok: true, project })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
