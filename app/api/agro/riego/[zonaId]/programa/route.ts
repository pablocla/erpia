import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { addPrograma, deletePrograma, findZona, listProgramas, updatePrograma } from "@/lib/agro/iot-stub-store"

const programaCreateSchema = z.object({
  nombre: z.string().min(1),
  diaSemana: z.array(z.coerce.number().int()).min(1),
  horaInicio: z.string().min(1),
  duracionMin: z.coerce.number().int().min(1),
  activo: z.boolean().optional(),
})

const programaUpdateSchema = z.object({
  programaId: z.coerce.number().int().positive(),
  nombre: z.string().min(1).optional(),
  diaSemana: z.array(z.coerce.number().int()).optional(),
  horaInicio: z.string().min(1).optional(),
  duracionMin: z.coerce.number().int().min(1).optional(),
  activo: z.boolean().optional(),
})

interface Params {
  params: Promise<{ zonaId: string }>
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response
  const { zonaId } = await params
  const id = Number(zonaId)
  if (!id) return NextResponse.json({ error: "zonaId inválido" }, { status: 400 })

  return NextResponse.json({ programas: listProgramas(id, auth.auth.empresaId) })
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response
  const { zonaId } = await params
  const id = Number(zonaId)
  if (!id) return NextResponse.json({ error: "zonaId inválido" }, { status: 400 })

  const zona = findZona(id, auth.auth.empresaId)
  if (!zona) return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 })

  const body = await request.json()
  const parsed = programaCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "payload invalido", issues: parsed.error.flatten() }, { status: 400 })
  }
  const { nombre, diaSemana, horaInicio, duracionMin, activo } = parsed.data

  const programa = addPrograma({
    zonaId: id,
    nombre,
    diaSemana,
    horaInicio,
    duracionMin,
    activo: activo !== false,
    empresaId: auth.auth.empresaId,
  })

  return NextResponse.json(programa, { status: 201 })
}

export async function PUT(request: NextRequest, { params }: Params) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response
  const { zonaId } = await params
  const id = Number(zonaId)
  if (!id) return NextResponse.json({ error: "zonaId inválido" }, { status: 400 })

  const body = await request.json()
  const parsed = programaUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "payload invalido", issues: parsed.error.flatten() }, { status: 400 })
  }
  const { programaId, nombre, diaSemana, horaInicio, duracionMin, activo } = parsed.data

  const updated = updatePrograma(programaId, auth.auth.empresaId, {
    nombre,
    diaSemana,
    horaInicio,
    duracionMin,
    activo,
  })

  if (!updated || updated.zonaId !== id) return NextResponse.json({ error: "Programa no encontrado" }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = getAuthContext(request)
  if (!auth.ok) return auth.response
  const { zonaId } = await params
  const id = Number(zonaId)
  if (!id) return NextResponse.json({ error: "zonaId inválido" }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const programaId = Number(searchParams.get("programaId") ?? 0)
  if (!programaId) return NextResponse.json({ error: "programaId requerido" }, { status: 400 })

  const ok = deletePrograma(programaId, auth.auth.empresaId)
  if (!ok) return NextResponse.json({ error: "Programa no encontrado" }, { status: 404 })

  return NextResponse.json({ ok: true, zonaId: id, programaId })
}
