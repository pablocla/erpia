/**
 * /api/config/plantillas-asiento — CRUD plantillas de asientos contables
 *
 * GET  ?empresaId=1                → lista plantillas activas con líneas
 * POST { codigo, nombre, lineas: [...] }  → crea plantilla
 * POST { action: "generar", plantillaId, parametros, fecha, descripcion }  → genera asiento desde plantilla
 */

import { NextRequest, NextResponse } from "next/server"
import { plantillaAsientoService } from "@/lib/contabilidad/plantilla-asiento-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = Number(searchParams.get("empresaId") || "1")

    const plantillas = await plantillaAsientoService.listar(empresaId)
    return NextResponse.json({ plantillas, total: plantillas.length })
  } catch (error) {
    console.error("Error al listar plantillas:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.action === "generar") {
      const { plantillaId, parametros, fecha, descripcion, empresaId = 1 } = body
      if (!plantillaId || !parametros || !fecha) {
        return NextResponse.json({ error: "plantillaId, parametros y fecha requeridos" }, { status: 400 })
      }
      const asiento = await plantillaAsientoService.generarDesdePlantilla(
        plantillaId, parametros, new Date(fecha), descripcion || "", empresaId,
      )
      return NextResponse.json({ asiento }, { status: 201 })
    }

    const { empresaId = 1, ...data } = body
    if (!data.codigo || !data.nombre) {
      return NextResponse.json({ error: "codigo y nombre requeridos" }, { status: 400 })
    }

    const plantilla = await plantillaAsientoService.crear(data, empresaId)
    return NextResponse.json({ plantilla }, { status: 201 })
  } catch (error) {
    console.error("Error al crear plantilla:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    const plantilla = await plantillaAsientoService.actualizar(id, data)
    return NextResponse.json({ plantilla })
  } catch (error) {
    console.error("Error al actualizar plantilla:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    await plantillaAsientoService.eliminar(body.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error al eliminar plantilla:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
