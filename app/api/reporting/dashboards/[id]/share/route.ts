import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { SignJWT } from "jose"

function getEncodedSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "dev-pos-system-argentina-2025-unsafe"
  return new TextEncoder().encode(secret)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getAuthContext(request)
  if (!ctx.ok) return ctx.response

  const { id } = await params
  
  // Create a JWT for this dashboard
  const token = await new SignJWT({
    dashboardId: Number(id),
    empresaId: ctx.auth.empresaId,
    rol: "public_viewer"
  })
    .setProtectedHeader({ alg: "HS256" })
    // .setExpirationTime("24h") // For SaaS embedded dashboards, usually long-lived or no expiration
    .setIssuedAt()
    .sign(getEncodedSecret())

  return NextResponse.json({ token })
}
