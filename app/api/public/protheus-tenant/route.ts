import { NextRequest, NextResponse } from "next/server"
import { publicTenantCard } from "@/lib/auth/protheus-oauth-service"

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim()
  if (!slug) return NextResponse.json({ error: "slug requerido" }, { status: 400 })
  const card = await publicTenantCard(slug)
  if (!card) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })
  return NextResponse.json(card)
}
