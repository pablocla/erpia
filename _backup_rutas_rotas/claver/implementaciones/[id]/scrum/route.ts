import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import {
  asignarItemASprint,
  crearBacklogItem,
  crearSprint,
  getScrumData,
  moverBacklogItem,
  sincronizarBacklogDesdeFuentes,
} from "@/lib/ops/scrum-service"
import { SCRUM_ESTADOS, BACKLOG_TIPOS } from "@/lib/ops/scrum-types"
import { prisma } from "@/lib/prisma"

async function resolveEmpresaId(proyectoId: number) {
  const db = prisma as any
  const p = await db.proyectoImplementacion.findUnique({
    where: { id: proyectoId },
    select: { empresaId: true },
  })
  return p?.empresaId ?? null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response
    const { id } = await params
    const empresaId = await resolveEmpresaId(Number(id))
    if (!empresaId) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })
    const scrum = await getScrumData(empresaId)
    return NextResponse.json(scrum)
  } catch (error) {
    console.error("Error scrum GET:", error)
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
    const empresaId = await resolveEmpresaId(Number(id))
    if (!empresaId) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })

    const body = await request.json()
    const action = String(body?.action ?? "sync")

    if (action === "sync") {
      const scrum = await sincronizarBacklogDesdeFuentes(empresaId, ctx.auth.email)
      return NextResponse.json(scrum)
    }

    if (action === "create") {
      const tipo = String(body?.tipo ?? "servicio_custom")
      if (!BACKLOG_TIPOS.includes(tipo as (typeof BACKLOG_TIPOS)[number])) {
        return NextResponse.json({ error: "tipo inválido" }, { status: 400 })
      }
      const item = await crearBacklogItem(
        empresaId,
        {
          tipo: tipo as (typeof BACKLOG_TIPOS)[number],
          titulo: String(body?.titulo ?? ""),
          descripcion: body?.descripcion,
          visibilidadCliente: body?.visibilidadCliente !== false,
          storyPoints: body?.storyPoints,
          asignadoA: body?.asignadoA,
          vinculoRef: body?.vinculoRef,
        },
        ctx.auth.email,
      )
      return NextResponse.json(item, { status: 201 })
    }

    if (action === "move") {
      const estado = String(body?.estado ?? "")
      if (!SCRUM_ESTADOS.includes(estado as (typeof SCRUM_ESTADOS)[number])) {
        return NextResponse.json({ error: "estado inválido" }, { status: 400 })
      }
      const item = await moverBacklogItem(
        empresaId,
        String(body?.itemId),
        estado as (typeof SCRUM_ESTADOS)[number],
        ctx.auth.email,
      )
      return NextResponse.json(item)
    }

    if (action === "create_sprint") {
      const nombre = String(body?.nombre ?? "").trim()
      const inicio = String(body?.inicio ?? "")
      const fin = String(body?.fin ?? "")
      if (!nombre || !inicio || !fin) {
        return NextResponse.json({ error: "nombre, inicio y fin requeridos" }, { status: 400 })
      }
      const scrum = await crearSprint(empresaId, { nombre, inicio, fin }, ctx.auth.email)
      return NextResponse.json(scrum)
    }

    if (action === "assign_sprint") {
      const item = await asignarItemASprint(
        empresaId,
        String(body?.itemId),
        body?.sprintId ? String(body.sprintId) : null,
        ctx.auth.email,
      )
      return NextResponse.json(item)
    }

    return NextResponse.json({ error: "action desconocida" }, { status: 400 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}