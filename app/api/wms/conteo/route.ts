import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as cicloConteoService from "@/lib/wms/ciclo-conteo-service"
import { z } from "zod"

const schema = z.object({
  action: z.enum(["crear", "cargar", "cerrar"]),
  depositoId: z.number().int().positive().optional(),
  claseAbc: z.string().optional(),
  conteoId: z.number().int().positive().optional(),
  aplicarAjustes: z.boolean().optional(),
  items: z
    .array(
      z.object({
        lineaId: z.number().int().positive(),
        stockContado: z.number(),
        observaciones: z.string().optional(),
      }),
    )
    .optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const data = await cicloConteoService.listarConteos(ctx.auth.empresaId)
    return NextResponse.json(data)
  } catch (error) {
    logError("api/wms/conteo:GET", error, request)
    return NextResponse.json({ error: "Error al listar conteos" }, { status: 500 })
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
      const c = await cicloConteoService.crearConteoCiclico({
        empresaId: ctx.auth.empresaId,
        depositoId: d.depositoId,
        claseAbc: d.claseAbc,
      })
      return NextResponse.json(c, { status: 201 })
    }

    if (!d.conteoId) return NextResponse.json({ error: "conteoId requerido" }, { status: 400 })

    if (d.action === "cargar") {
      const c = await cicloConteoService.cargarConteo(
        ctx.auth.empresaId,
        d.conteoId,
        d.items ?? [],
      )
      return NextResponse.json(c)
    }

    const c = await cicloConteoService.cerrarConteo(
      ctx.auth.empresaId,
      d.conteoId,
      d.aplicarAjustes ?? true,
    )
    return NextResponse.json(c)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error"
    if (msg === "CONTEO_NO_ENCONTRADO") {
      return NextResponse.json({ error: msg }, { status: 404 })
    }
    logError("api/wms/conteo:POST", error, request)
    return NextResponse.json({ error: "Error en conteo cíclico" }, { status: 500 })
  }
}
