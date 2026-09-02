import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { obtenerReferralEmpresa } from "@/lib/comercial/viral-referral-service"

/**
 * GET /api/comercial/referrals
 * Devuelve el link de referido, código y recompensas ganadas para el usuario.
 */
export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const data = await obtenerReferralEmpresa(auth.auth.empresaId)
    return NextResponse.json({ ok: true, ...data })
  } catch (err) {
    console.error("[api/comercial/referrals] Error:", err)
    return NextResponse.json({ error: "Error obteniendo datos de referidos" }, { status: 500 })
  }
}
