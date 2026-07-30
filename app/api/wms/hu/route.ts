import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as huService from "@/lib/wms/hu-service"
import { z } from "zod"

const schema = z.object({
  action: z.enum(["crear", "cargar", "cerrar"]),
  depositoId: z.number().int().positive().optional(),
  codigo: z.string().optional(),
  tipo: z.string().optional(),
  ubicacionId: z.number().int().positive().optional().nullable(),
  huId: z.number().int().positive().optional(),
  productoId: z.number().int().positive().optional(),
  cantidad: z.number().positive().optional(),
  loteId: z.number().int().positive().optional().nullable(),
  fromUbicacionId: z.number().int().positive().optional().nullable(),
  pesoKg: z.number().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const depositoId = request.nextUrl.searchParams.get("depositoId")
    const data = await huService.listarHu(
      ctx.auth.empresaId,
      depositoId ? Number(depositoId) : undefined,
    )
    return NextResponse.json(data)
  } catch (error) {
    logError("api/wms/hu:GET", error, request)
    return NextResponse.json({ error: "Error al listar HU" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }
    const d = parsed.data

    if (d.action === "crear") {
      if (!d.depositoId) return NextResponse.json({ error: "depositoId requerido" }, { status: 400 })
      const hu = await huService.crearHu({
        empresaId: ctx.auth.empresaId,
        depositoId: d.depositoId,
        codigo: d.codigo,
        tipo: d.tipo,
        ubicacionId: d.ubicacionId,
        pesoKg: d.pesoKg,
      })
      return NextResponse.json(hu, { status: 201 })
    }

    if (!d.huId) return NextResponse.json({ error: "huId requerido" }, { status: 400 })

    if (d.action === "cerrar") {
      const hu = await huService.cerrarHu(ctx.auth.empresaId, d.huId)
      return NextResponse.json(hu)
    }

    if (!d.productoId || !d.cantidad) {
      return NextResponse.json({ error: "productoId y cantidad requeridos" }, { status: 400 })
    }
    const hu = await huService.cargarHu({
      empresaId: ctx.auth.empresaId,
      huId: d.huId,
      productoId: d.productoId,
      cantidad: d.cantidad,
      loteId: d.loteId,
      fromUbicacionId: d.fromUbicacionId,
    })
    return NextResponse.json(hu)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error"
    if (["HU_NO_ENCONTRADA", "HU_DESPACHADA", "HU_SIN_UBICACION", "STOCK_UBICACION_INSUFICIENTE"].includes(msg)) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    logError("api/wms/hu:POST", error, request)
    return NextResponse.json({ error: "Error en handling unit" }, { status: 500 })
  }
}
