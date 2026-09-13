import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import {
  createPartner,
  ensureMockEnergyPartner,
  listPartners,
} from "@/lib/works/works-service"

export async function GET(request: NextRequest) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response
  const { searchParams } = new URL(request.url)
  if (searchParams.get("ensureMock") === "1") {
    await ensureMockEnergyPartner()
  }
  const partners = await listPartners({
    activo:
      searchParams.get("activo") === "1"
        ? true
        : searchParams.get("activo") === "0"
          ? false
          : undefined,
    rubro: searchParams.get("rubro") ?? undefined,
  })
  return NextResponse.json({ ok: true, partners })
}

export async function POST(request: NextRequest) {
  const auth = await getClaverAnalystContext(request)
  if (!auth.ok) return auth.response
  try {
    const body = await request.json()
    const partner = await createPartner(body)
    return NextResponse.json({ ok: true, partner })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
