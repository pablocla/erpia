import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { updatePartner } from "@/lib/works/works-service"
import { prisma } from "@/lib/prisma"

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Ctx) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  const partner = await prisma.worksPartner.findUnique({ where: { id } })
  if (!partner) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json({ ok: true, partner })
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response
  const { id } = await context.params
  try {
    const body = await request.json()
    const partner = await updatePartner(id, body)
    return NextResponse.json({ ok: true, partner })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
