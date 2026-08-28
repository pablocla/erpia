import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { devolverMaquinariaContrato } from "@/lib/oficios/alquiler-maquinaria-service"

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  const params = await props.params

  try {
    const body = await request.json().catch(() => ({}))
    const res = await devolverMaquinariaContrato(auth.auth.empresaId, params.id, body)
    return NextResponse.json({ ok: true, data: res })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
