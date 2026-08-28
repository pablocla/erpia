import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { solicitarRetiroAfiliado } from "@/lib/afiliados/afiliados-service"

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { aliasMercadoPago } = body

    if (!aliasMercadoPago) {
      return NextResponse.json({ ok: false, error: "El alias de Mercado Pago es requerido" }, { status: 400 })
    }

    const resultado = await solicitarRetiroAfiliado(auth.auth.empresaId, aliasMercadoPago)
    return NextResponse.json({ ok: true, data: resultado })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  }
}
