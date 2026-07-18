import { type NextRequest, NextResponse } from "next/server"
import { getClaverAnalystContext } from "@/lib/auth/claver-analyst"
import { crearStakeholderCliente, listarStakeholders, revocarStakeholder } from "@/lib/ops/stakeholder-service"
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
    const stakeholders = await listarStakeholders(empresaId)
    return NextResponse.json({ stakeholders })
  } catch (error) {
    console.error("Error list stakeholders:", error)
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
    const nombre = String(body?.nombre ?? "").trim()
    const email = String(body?.email ?? "").trim()
    if (!nombre || !email) {
      return NextResponse.json({ error: "nombre y email requeridos" }, { status: 400 })
    }

    const result = await crearStakeholderCliente({
      empresaId,
      nombre,
      email,
      invitadoPor: ctx.auth.email,
      enviarEmail: body?.enviarEmail !== false,
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getClaverAnalystContext(request)
    if (!ctx.ok) return ctx.response
    const { id } = await params
    const empresaId = await resolveEmpresaId(Number(id))
    if (!empresaId) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 })

    const usuarioId = Number(new URL(request.url).searchParams.get("usuarioId"))
    if (!usuarioId) return NextResponse.json({ error: "usuarioId requerido" }, { status: 400 })

    await revocarStakeholder(usuarioId, empresaId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}