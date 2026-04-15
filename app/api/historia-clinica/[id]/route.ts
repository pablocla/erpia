import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { historiaClinicaService } from "@/lib/historia-clinica/historia-clinica-service"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/historia-clinica/[id] — Get patient detail + full history
 * PATCH /api/historia-clinica/[id] — Update patient data
 * DELETE /api/historia-clinica/[id] — Deactivate patient (soft delete)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const paciente = await historiaClinicaService.obtenerPaciente(Number(id))
    if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

    // Full consultation history
    const consultas = await historiaClinicaService.listarConsultas(Number(id), 1, 100)

    return NextResponse.json({ ...paciente, historialConsultas: consultas.consultas })
  } catch (error) {
    console.error("Error al obtener paciente:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const body = await request.json()
    const paciente = await historiaClinicaService.actualizarPaciente(Number(id), body)
    return NextResponse.json(paciente)
  } catch (error: any) {
    if (error.message?.includes("no encontrado")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error("Error al actualizar paciente:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const paciente = await prisma.paciente.findFirst({
      where: { id: Number(id), empresaId: ctx.auth.empresaId },
    })
    if (!paciente) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })

    await prisma.paciente.update({
      where: { id: paciente.id },
      data: { activo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al desactivar paciente:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
