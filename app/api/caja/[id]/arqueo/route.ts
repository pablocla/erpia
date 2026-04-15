import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { arqueoCajaService } from "@/lib/caja/arqueo-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const cajaId = parseInt(id, 10)
    const arqueos = await arqueoCajaService.listarPorCaja(cajaId)
    return NextResponse.json({ success: true, arqueos })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const cajaId = parseInt(id, 10)
    const body = await request.json()

    const resultado = await arqueoCajaService.realizarArqueo(cajaId, auth.auth.empresaId, {
      efectivoDeclarado: body.efectivoDeclarado ?? 0,
      tarjetaDeclarado: body.tarjetaDeclarado ?? 0,
      transferenciaDeclarado: body.transferenciaDeclarado ?? 0,
      chequeDeclarado: body.chequeDeclarado ?? 0,
      qrDeclarado: body.qrDeclarado ?? 0,
      justificacion: body.justificacion,
    })

    return NextResponse.json({ success: true, ...resultado }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? "Error" }, { status: 500 })
  }
}
