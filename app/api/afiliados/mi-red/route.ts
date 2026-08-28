import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getAfiliadoInfo } from "@/lib/afiliados/afiliados-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const info = await getAfiliadoInfo(auth.auth.empresaId)
    return NextResponse.json({ ok: true, data: info })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
