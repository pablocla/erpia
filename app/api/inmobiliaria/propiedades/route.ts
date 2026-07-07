import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { tieneAccesoInmobiliaria } from "@/lib/inmobiliaria/inmobiliaria-access"
import {
  actualizarEstadoPropiedad,
  crearPropiedad,
  listarPropiedades,
  resumenInmobiliaria,
} from "@/lib/inmobiliaria/inmobiliaria-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const acceso = await tieneAccesoInmobiliaria(auth.auth.empresaId)
  if (!acceso) {
    return NextResponse.json({ error: "Módulo inmobiliaria no activo" }, { status: 403 })
  }

  const estado = request.nextUrl.searchParams.get("estado") ?? undefined
  const [propiedades, resumen] = await Promise.all([
    listarPropiedades(auth.auth.empresaId, estado),
    resumenInmobiliaria(auth.auth.empresaId),
  ])
  return NextResponse.json({ propiedades, resumen })
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const acceso = await tieneAccesoInmobiliaria(auth.auth.empresaId)
  if (!acceso) {
    return NextResponse.json({ error: "Módulo inmobiliaria no activo" }, { status: 403 })
  }

  const body = await request.json()

  if (body.action === "estado" && body.id) {
    const row = await actualizarEstadoPropiedad(
      auth.auth.empresaId,
      Number(body.id),
      body.estado,
    )
    return NextResponse.json(row)
  }

  if (!body.titulo?.trim() || !body.direccion?.trim()) {
    return NextResponse.json({ error: "Título y dirección son obligatorios" }, { status: 400 })
  }

  const row = await crearPropiedad(auth.auth.empresaId, body)
  return NextResponse.json(row, { status: 201 })
}