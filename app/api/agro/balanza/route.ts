import { NextRequest, NextResponse } from "next/server"
import { getAuthContext, whereEmpresa } from "@/lib/auth/empresa-guard"
import { agroService } from "@/lib/agro/agro-service"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? 1)
  const limit = Number(searchParams.get("limit") ?? 50)
  const granoId = searchParams.get("granoId") ? Number(searchParams.get("granoId")) : undefined
  const tipo = searchParams.get("tipo") ?? undefined
  const desde = searchParams.get("desde") ?? undefined
  const hasta = searchParams.get("hasta") ?? undefined

  const result = await agroService.listarTickets(auth.auth.empresaId, { page, limit, granoId, tipo, desde, hasta })
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const body = await request.json()
  const { tipo, granoId, pesoBruto, tara } = body

  if (!tipo || !granoId || pesoBruto == null || tara == null) {
    return NextResponse.json({ error: "tipo, granoId, pesoBruto y tara son requeridos" }, { status: 400 })
  }

  // Validar que el grano pertenece a la empresa
  const grano = await prisma.agroGrano.findFirst({
    where: { id: Number(granoId), ...whereEmpresa(auth.auth.empresaId) },
  })
  if (!grano) {
    return NextResponse.json({ error: "Grano no encontrado" }, { status: 404 })
  }

  const ticket = await agroService.crearTicket(auth.auth.empresaId, {
    tipo,
    granoId: Number(granoId),
    proveedorId: body.proveedorId ? Number(body.proveedorId) : undefined,
    siloId: body.siloId ? Number(body.siloId) : undefined,
    patente: body.patente,
    conductor: body.conductor,
    pesoBruto: Number(pesoBruto),
    tara: Number(tara),
    humedad: body.humedad ? Number(body.humedad) : undefined,
    impureza: body.impureza ? Number(body.impureza) : undefined,
    proteina: body.proteina ? Number(body.proteina) : undefined,
    contratoId: body.contratoId ? Number(body.contratoId) : undefined,
    observaciones: body.observaciones,
    cartaPorteNumero: body.cartaPorteNumero,
  })
  return NextResponse.json(ticket, { status: 201 })
}

