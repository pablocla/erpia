import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { emitirLlaveVirtual, revocarLlaveVirtual } from "@/lib/hoteleria/smart-locks-service"

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { action, reservaId, habitacionId, llaveId } = body

    if (action === "emitir") {
      const res = await emitirLlaveVirtual(auth.auth.empresaId, reservaId, habitacionId)
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: res.error }, { status: 400 })
      }
      return NextResponse.json({ ok: true, pinCode: res.pinCode })
    }

    if (action === "revocar" && llaveId) {
      const res = await revocarLlaveVirtual(auth.auth.empresaId, llaveId)
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: res.error }, { status: 400 })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: false, error: "Acción no válida" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
