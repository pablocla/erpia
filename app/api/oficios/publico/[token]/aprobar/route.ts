import { NextRequest, NextResponse } from "next/server"
import { aprobarPresupuestoPublico } from "@/lib/oficios/oficios-service"

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ token: string }> },
) {
  const params = await props.params
  try {
    const body = await request.json()
    const { opcionElegida, firmaClienteUrl } = body

    if (!opcionElegida) {
      return NextResponse.json({ ok: false, error: "Debe seleccionar una opción" }, { status: 400 })
    }

    const ipFirma = request.headers.get("x-forwarded-for") ?? "127.0.0.1"

    const actualizado = await aprobarPresupuestoPublico(params.token, {
      opcionElegida,
      firmaClienteUrl,
      ipFirma,
    })

    return NextResponse.json({ ok: true, data: actualizado })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
