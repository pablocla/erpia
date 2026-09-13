import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { listWorksProjects } from "@/lib/works/works-service"

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
