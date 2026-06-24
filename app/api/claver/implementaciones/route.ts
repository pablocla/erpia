import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getClaverAnalystContext,
  getAnalystEmpresaScope,
  canAnalystAccessEmpresa,
} from "@/lib/auth/claver-analyst"
import {
  crearProyectoImplementacion,
  listProyectosImplementacion,
  getMetricasTorreImplementacion,
} from "@/lib/ops/implementacion-service"

const createSchema = z.object({
  empresaId: z.coerce.number().int().positive(),
  planComercial: z.string().optional(),
  fechaVenta: z.string().datetime().optional(),
  fechaKickoff: z.string().datetime().optional(),
  fechaObjetivoGoLive: z.string().datetime().optional(),
  urlAcceso: z.string().url().optional(),
  notas: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const scope = await getAnalystEmpresaScope(ctx.auth.email)
    const empresaIds = scope.mode === "assigned" ? scope.empresaIds : undefined

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get("estado") ?? undefined
    const fase = searchParams.get("fase") ?? undefined
    const metricasOnly = searchParams.get("metricas") === "1"

    if (metricasOnly) {
      const metricas = await getMetricasTorreImplementacion(empresaIds)
      return NextResponse.json({ metricas, scope: scope.mode })
    }

    const data = await listProyectosImplementacion({ empresaIds, estado, fase })
    return NextResponse.json({ data, scope: scope.mode, total: data.length })
  } catch (error) {
    console.error("Error listar implementaciones:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const allowed = await canAnalystAccessEmpresa(ctx.auth.email, parsed.data.empresaId)
    if (!allowed) {
      return NextResponse.json({ error: "No tenés asignado este cliente" }, { status: 403 })
    }

    const proyecto = await crearProyectoImplementacion({
      empresaId: parsed.data.empresaId,
      analistaEmail: ctx.auth.email,
      planComercial: parsed.data.planComercial,
      fechaVenta: parsed.data.fechaVenta ? new Date(parsed.data.fechaVenta) : undefined,
      fechaKickoff: parsed.data.fechaKickoff ? new Date(parsed.data.fechaKickoff) : undefined,
      fechaObjetivoGoLive: parsed.data.fechaObjetivoGoLive
        ? new Date(parsed.data.fechaObjetivoGoLive)
        : undefined,
      urlAcceso: parsed.data.urlAcceso,
      notas: parsed.data.notas,
    })

    return NextResponse.json(proyecto, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    if (msg.includes("Ya existe")) {
      return NextResponse.json({ error: msg }, { status: 409 })
    }
    console.error("Error crear implementación:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}