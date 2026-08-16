import { NextRequest, NextResponse } from "next/server"
import { getTrabajoByTokenPublico } from "@/lib/oficios/oficios-service"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ token: string }> },
) {
  const params = await props.params
  try {
    const trabajo = await getTrabajoByTokenPublico(params.token)
    if (!trabajo) {
      return NextResponse.json({ ok: false, error: "Trabajo no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ ok: true, data: trabajo })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
