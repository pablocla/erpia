import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { getWorksProject, updateWorksProject } from "@/lib/works/works-service"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Ctx) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  const project = await getWorksProject(id)
  if (!project) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json({ ok: true, project })
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  try {
    const body = await request.json()
    const project = await updateWorksProject(id, body)
    return NextResponse.json({ ok: true, project })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
