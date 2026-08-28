import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { getTrabajoById, updateTrabajo } from "@/lib/oficios/oficios-service"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const trabajo = await getTrabajoById(auth.auth.empresaId, params.id)
    if (!trabajo) {
      return NextResponse.json({ ok: false, error: "Trabajo no encontrado" }, { status: 404 })
    }
    return NextResponse.json({ ok: true, data: trabajo })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const actualizado = await updateTrabajo(auth.auth.empresaId, params.id, body)
    return NextResponse.json({ ok: true, data: actualizado })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params
  const auth = await getAuthContext(request)
  if (!auth.ok) return auth.response

  try {
    await prisma.oficioTrabajo.deleteMany({
      where: { id: params.id, empresaId: auth.auth.empresaId },
    })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}
