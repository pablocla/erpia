import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { agroService } from "@/lib/agro/agro-service"

export async function GET(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? 1)
  const limit = Number(searchParams.get("limit") ?? 50)
  const estado = searchParams.get("estado") ?? undefined

  const result = await agroService.listarLiquidaciones(auth.auth.empresaId, { page, limit, estado })
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { contratoId, proveedorId, campana, toneladasLiquidadas, precioUnitario } = body

  if (!contratoId || !proveedorId || !campana || !toneladasLiquidadas || !precioUnitario) {
    return NextResponse.json(
      { error: "contratoId, proveedorId, campana, toneladasLiquidadas y precioUnitario son requeridos" },
      { status: 400 }
    )
  }

  const liq = await agroService.crearLiquidacion(auth.auth.empresaId, {
    contratoId: Number(contratoId),
    proveedorId: Number(proveedorId),
    campana,
    toneladasLiquidadas: Number(toneladasLiquidadas),
    precioUnitario: Number(precioUnitario),
    descuentoCalidad: body.descuentoCalidad ? Number(body.descuentoCalidad) : undefined,
    observaciones: body.observaciones,
  })
  return NextResponse.json(liq, { status: 201 })
}
