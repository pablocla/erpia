import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { agroService } from "@/lib/agro/agro-service"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? 1)
  const limit = Number(searchParams.get("limit") ?? 50)
  const tipo = searchParams.get("tipo") ?? undefined
  const estado = searchParams.get("estado") ?? undefined
  const campana = searchParams.get("campana") ?? undefined

  const result = await agroService.listarContratos(auth.auth.empresaId, { page, limit, tipo, estado, campana })
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { tipo, granoId, campana, toneladasPactadas } = body

  if (!tipo || !granoId || !campana || !toneladasPactadas) {
    return NextResponse.json({ error: "tipo, granoId, campana y toneladasPactadas son requeridos" }, { status: 400 })
  }

  const contrato = await agroService.crearContrato(auth.auth.empresaId, {
    tipo,
    granoId: Number(granoId),
    proveedorId: body.proveedorId ? Number(body.proveedorId) : undefined,
    clienteId: body.clienteId ? Number(body.clienteId) : undefined,
    campana,
    toneladasPactadas: Number(toneladasPactadas),
    precioPacto: body.precioPacto ? Number(body.precioPacto) : undefined,
    moneda: body.moneda ?? "ARS",
    fechaEntrega: body.fechaEntrega,
    observaciones: body.observaciones,
  })
  return NextResponse.json(contrato, { status: 201 })
}
