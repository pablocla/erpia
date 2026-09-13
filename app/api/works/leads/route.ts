import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { createWorksLead, listWorksProjects } from "@/lib/works/works-service"

export async function GET(request: NextRequest) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const projects = await listWorksProjects({
    segmento: searchParams.get("segmento") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  })
  return NextResponse.json({ ok: true, projects })
}

export async function POST(request: NextRequest) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const result = await createWorksLead({
      ...body,
      fuente: body.fuente ?? "manual",
      ownerAgent: body.ownerAgent ?? "comercial",
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
