import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  activarHardwareBundle,
  getHardwareChecklist,
  setHardwareChecklistItem,
} from "@/lib/comercial/hardware-bundle"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const data = await getHardwareChecklist(auth.auth.empresaId)
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json().catch(() => ({}))
    if (body.action === "activar") {
      const data = await activarHardwareBundle(auth.auth.empresaId)
      return NextResponse.json({ ok: true, ...data })
    }
    if (body.action === "toggle" && body.itemId) {
      const data = await setHardwareChecklistItem(
        auth.auth.empresaId,
        String(body.itemId),
        Boolean(body.done),
      )
      return NextResponse.json({ ok: true, ...data })
    }
    return NextResponse.json({ error: "action inválida" }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 },
    )
  }
}

