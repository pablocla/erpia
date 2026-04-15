/**
 * /api/config/maestros — CRUD genérico para todos los maestros empresa-scoped
 *
 * GET  ?modelo=tipoAsiento&empresaId=1        → lista maestros activos
 * POST { modelo, ...data }                     → crea un nuevo registro
 * PUT  { modelo, id, ...data }                 → actualiza
 * DELETE { modelo, id }                         → soft-delete (activo=false)
 *
 * Modelos soportados: rubroContable, tipoAsiento, tipoComprobanteMaestro,
 * tipoRetencion, regimenRetencion, tipoMovimientoBancario, conceptoCobroPago,
 * entidadFinanciera, sucursal, cobrador, tipoOperacionComercial, cajaTipo
 */

import { NextRequest, NextResponse } from "next/server"
import { maestroService } from "@/lib/config/maestro-service"

const MODELOS_VALIDOS = [
  "rubroContable", "tipoAsiento", "tipoComprobanteMaestro",
  "tipoRetencion", "regimenRetencion", "tipoMovimientoBancario",
  "conceptoCobroPago", "entidadFinanciera", "sucursal", "cobrador",
  "tipoOperacionComercial", "cajaTipo",
] as const

type MaestroModel = (typeof MODELOS_VALIDOS)[number]

function validarModelo(modelo: string | null): modelo is MaestroModel {
  return modelo != null && MODELOS_VALIDOS.includes(modelo as MaestroModel)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const modelo = searchParams.get("modelo")
    const empresaId = Number(searchParams.get("empresaId") || "1")

    if (!validarModelo(modelo)) {
      return NextResponse.json({ error: "Modelo inválido", modelosValidos: MODELOS_VALIDOS }, { status: 400 })
    }

    const data = await maestroService.listar(modelo, empresaId)
    return NextResponse.json({ data, modelo, total: data.length })
  } catch (error) {
    console.error("Error al listar maestro:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { modelo, empresaId = 1, ...data } = body

    if (!validarModelo(modelo)) {
      return NextResponse.json({ error: "Modelo inválido", modelosValidos: MODELOS_VALIDOS }, { status: 400 })
    }

    const registro = await maestroService.crear(modelo, data, empresaId)
    return NextResponse.json({ registro }, { status: 201 })
  } catch (error) {
    console.error("Error al crear maestro:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { modelo, id, ...data } = body

    if (!validarModelo(modelo) || !id) {
      return NextResponse.json({ error: "modelo e id requeridos" }, { status: 400 })
    }

    const registro = await maestroService.actualizar(modelo, id, data)
    return NextResponse.json({ registro })
  } catch (error) {
    console.error("Error al actualizar maestro:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { modelo, id } = body

    if (!validarModelo(modelo) || !id) {
      return NextResponse.json({ error: "modelo e id requeridos" }, { status: 400 })
    }

    await maestroService.desactivar(modelo, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error al eliminar maestro:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
