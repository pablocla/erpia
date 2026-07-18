import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getClaverAnalystContext,
  canAnalystAccessEmpresa,
} from "@/lib/auth/claver-analyst"
import { CCA_FASE_CODIGOS } from "@/lib/ops/implementacion-types"
import {
  actualizarProyectoImplementacion,
  getProyectoImplementacion,
  marcarFaseImplementacion,
} from "@/lib/ops/implementacion-service"

const patchSchema = z.object({
  planComercial: z.string().optional(),
  analistaEmail: z.string().email().optional(),
  fechaKickoff: z.string().datetime().nullable().optional(),
  fechaObjetivoGoLive: z.string().datetime().nullable().optional(),
  fechaGoLiveReal: z.string().datetime().nullable().optional(),
  urlAcceso: z.string().optional(),
  packOnboardEntregado: z.boolean().optional(),
  notas: z.string().optional(),
  estado: z.enum(["activo", "pausado", "completado", "cancelado"]).optional(),
  fase: z
    .object({
      codigo: z.enum(CCA_FASE_CODIGOS as [string, ...string[]]),
      completado: z.boolean(),
      notas: z.string().optional(),
    })
    .optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const proyecto = await getProyectoImplementacion(Number(id))
    if (!proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
    }

    const allowed = await canAnalystAccessEmpresa(ctx.auth.email, proyecto.empresaId)
    if (!allowed) {
      return NextResponse.json({ error: "No tenés asignado este cliente" }, { status: 403 })
    }

    return NextResponse.json(proyecto)
  } catch (error) {
    console.error("Error obtener implementación:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const proyectoId = Number(id)
    const existente = await getProyectoImplementacion(proyectoId)
    if (!existente) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
    }

    const allowed = await canAnalystAccessEmpresa(ctx.auth.email, existente.empresaId)
    if (!allowed) {
      return NextResponse.json({ error: "No tenés asignado este cliente" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    if (parsed.data.fase) {
      const updated = await marcarFaseImplementacion(
        proyectoId,
        parsed.data.fase.codigo as (typeof CCA_FASE_CODIGOS)[number],
        { completado: parsed.data.fase.completado, notas: parsed.data.fase.notas },
        ctx.auth.email,
      )
      return NextResponse.json(updated)
    }

    const updated = await actualizarProyectoImplementacion(proyectoId, {
      planComercial: parsed.data.planComercial,
      analistaEmail: parsed.data.analistaEmail,
      fechaKickoff: parsed.data.fechaKickoff === null ? null : parsed.data.fechaKickoff
        ? new Date(parsed.data.fechaKickoff)
        : undefined,
      fechaObjetivoGoLive: parsed.data.fechaObjetivoGoLive === null
        ? null
        : parsed.data.fechaObjetivoGoLive
          ? new Date(parsed.data.fechaObjetivoGoLive)
          : undefined,
      fechaGoLiveReal: parsed.data.fechaGoLiveReal === null
        ? null
        : parsed.data.fechaGoLiveReal
          ? new Date(parsed.data.fechaGoLiveReal)
          : undefined,
      urlAcceso: parsed.data.urlAcceso,
      packOnboardEntregado: parsed.data.packOnboardEntregado,
      notas: parsed.data.notas,
      estado: parsed.data.estado,
    })

    const enriched = await getProyectoImplementacion(proyectoId)
    return NextResponse.json(enriched ?? updated)
  } catch (error) {
    console.error("Error actualizar implementación:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}