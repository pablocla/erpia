import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { isClaverAnalyst } from "@/lib/auth/claver-analyst"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) {
    return NextResponse.json({ isAnalyst: false, authenticated: false }, { status: 200 })
  }

  const isAnalyst = isClaverAnalyst(auth.auth.email, auth.auth.rol)

  return NextResponse.json({
    isAnalyst,
    authenticated: true,
    email: auth.auth.email,
    rol: auth.auth.rol,
    empresaId: auth.auth.empresaId,
  })
}
