import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { transitionProject } from "@/lib/works/works-service"
import type { WorksProjectStatus } from "@prisma/client"

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, context: Ctx) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  try {
    const body = await request.json()
    const to = body.to as WorksProjectStatus
    if (!to) throw new Error("to es obligatorio")
    const project = await transitionProject(id, to, {
      adminOverride: body.adminOverride === true,
      cancelReason: body.cancelReason,
      actorEmail: auth.auth.email,
    })
    return NextResponse.json({ ok: true, project })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
