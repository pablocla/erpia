import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import {
  cargarGasto,
  comunicadoConsorcio,
  crearUnidad,
  liquidarConsorcio,
  listarUnidades,
} from "@/lib/niche/consorcios-api-service"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  const { id } = await params
  const unidades = await listarUnidades(auth.auth.empresaId, Number(id))
  return NextResponse.json({ unidades })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response
  const { id } = await params
  const consorcioId = Number(id)
  const body = await request.json()
  const action = body.action as string

  switch (action) {
    case "unidad": {
      const row = await crearUnidad(auth.auth.empresaId, consorcioId, body)
      return NextResponse.json(row, { status: 201 })
    }
    case "gasto": {
      const row = await cargarGasto(auth.auth.empresaId, consorcioId, body)
      return NextResponse.json(row, { status: 201 })
    }
    case "liquidar": {
      const result = await liquidarConsorcio(
        auth.auth.empresaId,
        consorcioId,
        body.periodo,
        Boolean(body.emitirFactura),
      )
      return NextResponse.json(result)
    }
    case "comunicado": {
      const result = await comunicadoConsorcio(auth.auth.empresaId, consorcioId, body)
      return NextResponse.json(result)
    }
    default:
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  }
}