import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { tieneAccesoInmobiliaria } from "@/lib/inmobiliaria/inmobiliaria-access"
import {
  crearContratoAlquiler,
  finalizarContrato,
  listarContratos,
} from "@/lib/inmobiliaria/inmobiliaria-service"

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const acceso = await tieneAccesoInmobiliaria(auth.auth.empresaId)
  if (!acceso) {
    return NextResponse.json({ error: "Módulo inmobiliaria no activo" }, { status: 403 })
  }

  const estado = request.nextUrl.searchParams.get("estado") ?? undefined
  const contratos = await listarContratos(auth.auth.empresaId, estado)
  return NextResponse.json(contratos)
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  const acceso = await tieneAccesoInmobiliaria(auth.auth.empresaId)
  if (!acceso) {
    return NextResponse.json({ error: "Módulo inmobiliaria no activo" }, { status: 403 })
  }

  const body = await request.json()

  if (body.action === "finalizar" && body.id) {
    try {
      const row = await finalizarContrato(auth.auth.empresaId, Number(body.id))
      return NextResponse.json(row)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al finalizar"
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  }

  if (!body.propiedadId || !body.inquilinoId || !body.montoMensual || !body.fechaInicio || !body.fechaFin) {
    return NextResponse.json(
      { error: "propiedadId, inquilinoId, montoMensual, fechaInicio y fechaFin son obligatorios" },
      { status: 400 },
    )
  }

  try {
    const row = await crearContratoAlquiler(auth.auth.empresaId, {
      propiedadId: Number(body.propiedadId),
      inquilinoId: Number(body.inquilinoId),
      propietarioId: body.propietarioId ? Number(body.propietarioId) : undefined,
      montoMensual: Number(body.montoMensual),
      diaVencimiento: body.diaVencimiento ? Number(body.diaVencimiento) : undefined,
      fechaInicio: body.fechaInicio,
      fechaFin: body.fechaFin,
      deposito: body.deposito != null ? Number(body.deposito) : undefined,
      garantiaTipo: body.garantiaTipo,
      observaciones: body.observaciones,
    })
    return NextResponse.json(row, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al crear contrato"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}