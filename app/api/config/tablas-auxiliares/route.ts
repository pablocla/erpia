/**
 * /api/config/tablas-auxiliares — CRUD de tablas auxiliares genéricas
 *
 * GET  ?empresaId=1               → lista todas las tablas
 * GET  ?codigo=MOTIVOS_ANULACION  → obtiene tabla con valores
 * POST { codigo, nombre, descripcion? }  → crea tabla
 * POST { action: "valor", tablaId, codigo, valor, descripcion?, orden? }  → agrega valor
 * PUT  { id, nombre?, descripcion? }  → actualiza tabla
 * DELETE { id }                       → soft-delete tabla
 */

import { NextRequest, NextResponse } from "next/server"
import { tablaAuxiliarService } from "@/lib/config/tabla-auxiliar-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empresaId = Number(searchParams.get("empresaId") || "1")
    const codigo = searchParams.get("codigo")
    const id = searchParams.get("id")

    if (id) {
      const tabla = await tablaAuxiliarService.obtenerTabla(Number(id))
      if (!tabla) return NextResponse.json({ error: "Tabla no encontrada" }, { status: 404 })
      return NextResponse.json({ tabla })
    }

    if (codigo) {
      const tabla = await tablaAuxiliarService.obtenerTablaPorCodigo(codigo, empresaId)
      if (!tabla) return NextResponse.json({ error: "Tabla no encontrada" }, { status: 404 })
      return NextResponse.json({ tabla })
    }

    const tablas = await tablaAuxiliarService.listarTablas(empresaId)
    return NextResponse.json({ tablas, total: tablas.length })
  } catch (error) {
    console.error("Error tablas auxiliares:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.action === "valor") {
      const { tablaId, codigo, valor, descripcion, orden } = body
      if (!tablaId || !codigo || !valor) {
        return NextResponse.json({ error: "tablaId, codigo y valor requeridos" }, { status: 400 })
      }
      const v = await tablaAuxiliarService.agregarValor(tablaId, { codigo, valor, descripcion, orden })
      return NextResponse.json({ valor: v }, { status: 201 })
    }

    const { empresaId = 1, ...data } = body
    if (!data.codigo || !data.nombre) {
      return NextResponse.json({ error: "codigo y nombre requeridos" }, { status: 400 })
    }

    const tabla = await tablaAuxiliarService.crearTabla(data, empresaId)
    return NextResponse.json({ tabla }, { status: 201 })
  } catch (error) {
    console.error("Error crear tabla:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    const tabla = await tablaAuxiliarService.actualizarTabla(id, data)
    return NextResponse.json({ tabla })
  } catch (error) {
    console.error("Error actualizar tabla:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    await tablaAuxiliarService.eliminarTabla(body.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error eliminar tabla:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
