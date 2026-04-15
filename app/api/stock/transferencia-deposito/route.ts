import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { transferenciaDepositoService } from "@/lib/stock/transferencia-deposito-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const transferencias = await transferenciaDepositoService.listar(auth.auth.empresaId)
    return NextResponse.json({ success: true, transferencias })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const { depositoOrigenId, depositoDestinoId, lineas, observaciones } = body

    if (!depositoOrigenId || !depositoDestinoId || !lineas?.length) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const result = await transferenciaDepositoService.ejecutar(
      depositoOrigenId,
      depositoDestinoId,
      lineas,
      auth.auth.empresaId,
      observaciones,
    )

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Error" }, { status: 500 })
  }
}
