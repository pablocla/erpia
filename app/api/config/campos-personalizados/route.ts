/**
 * /api/config/campos-personalizados — CRUD de campos dinámicos (EAV)
 *
 * GET  ?entidad=cliente&empresaId=1    → lista campos para una entidad
 * POST { entidad, nombreCampo, etiqueta, tipoDato, ... }  → crea campo
 * PUT  { id, etiqueta?, ... }          → actualiza campo
 * DELETE { id }                         → soft-delete
 *
 * POST { action: "guardarValores", registroId, valores: [{ campoId, valorTexto?, ... }] }
 *      → guarda valores para un registro
 * GET  ?action=valores&entidad=X&registroId=N  → obtiene valores de un registro
 */

import { NextRequest, NextResponse } from "next/server"
import { campoPersonalizadoService } from "@/lib/config/campo-personalizado-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const empresaId = Number(searchParams.get("empresaId") || "1")

    if (action === "valores") {
      const entidad = searchParams.get("entidad")
      const registroId = Number(searchParams.get("registroId"))
      if (!entidad || !registroId) {
        return NextResponse.json({ error: "entidad y registroId requeridos" }, { status: 400 })
      }
      const valores = await campoPersonalizadoService.obtenerValores(entidad, registroId)
      return NextResponse.json({ valores })
    }

    const entidad = searchParams.get("entidad")
    if (!entidad) {
      return NextResponse.json({ error: "entidad requerida" }, { status: 400 })
    }

    const campos = await campoPersonalizadoService.listarCampos(entidad, empresaId)
    return NextResponse.json({ campos, total: campos.length })
  } catch (error) {
    console.error("Error campos personalizados:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (body.action === "guardarValores") {
      const { registroId, valores } = body
      if (!registroId || !valores?.length) {
        return NextResponse.json({ error: "registroId y valores requeridos" }, { status: 400 })
      }
      const result = await campoPersonalizadoService.guardarValoresBulk(registroId, valores)
      return NextResponse.json({ ok: true, count: result.length })
    }

    const { empresaId = 1, ...data } = body
    if (!data.entidad || !data.nombreCampo || !data.etiqueta || !data.tipoDato) {
      return NextResponse.json({ error: "entidad, nombreCampo, etiqueta y tipoDato requeridos" }, { status: 400 })
    }

    const campo = await campoPersonalizadoService.crearCampo(data, empresaId)
    return NextResponse.json({ campo }, { status: 201 })
  } catch (error) {
    console.error("Error crear campo:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    const campo = await campoPersonalizadoService.actualizarCampo(id, data)
    return NextResponse.json({ campo })
  } catch (error) {
    console.error("Error actualizar campo:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: "id requerido" }, { status: 400 })

    await campoPersonalizadoService.eliminarCampo(body.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error eliminar campo:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
