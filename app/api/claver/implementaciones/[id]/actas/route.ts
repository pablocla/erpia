import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  getClaverAnalystContext,
  canAnalystAccessEmpresa,
} from "@/lib/auth/claver-analyst"
import {
  getProyectoImplementacion,
  listActasImplementacion,
  crearActaImplementacion,
} from "@/lib/ops/implementacion-service"

const createSchema = z.object({
  tipo: z.enum(["kickoff", "uat", "cierre", "onboard_entrega", "otro"]),
  titulo: z.string().min(2),
  contenido: z.string().optional(),
  firmadoPor: z.string().optional(),
  firmadoCliente: z.boolean().optional(),
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

    const actas = await listActasImplementacion(proyecto.id)
    return NextResponse.json({ data: actas })
  } catch (error) {
    console.error("Error listar actas:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const proyectoId = Number(id)
    const proyecto = await getProyectoImplementacion(proyectoId)
    if (!proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
    }

    const allowed = await canAnalystAccessEmpresa(ctx.auth.email, proyecto.empresaId)
    if (!allowed) {
      return NextResponse.json({ error: "No tenés asignado este cliente" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.errors }, { status: 400 })
    }

    const acta = await crearActaImplementacion({
      proyectoId,
      tipo: parsed.data.tipo,
      titulo: parsed.data.titulo,
      contenido: parsed.data.contenido,
      firmadoPor: parsed.data.firmadoPor ?? ctx.auth.email,
      firmadoCliente: parsed.data.firmadoCliente,
    })

    return NextResponse.json(acta, { status: 201 })
  } catch (error) {
    console.error("Error crear acta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}