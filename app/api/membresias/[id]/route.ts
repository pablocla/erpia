import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

/**
 * GET /api/membresias/[id] — Get membership detail
 * PATCH /api/membresias/[id] — Update membership (renew, suspend, cancel)
 */

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const membresiaId = Number(id)
    if (isNaN(membresiaId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    // ── TENANT ISOLATION ──
    const membresia = await (prisma as any).membresia.findFirst({
      where: { id: membresiaId, cliente: { empresaId: ctx.auth.empresaId } },
      include: {
        plan: true,
        cliente: { select: { id: true, nombre: true, email: true, telefono: true } },
      },
    })

    if (!membresia) return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 })

    return NextResponse.json({ success: true, membresia })
  } catch (error) {
    console.error("Error al obtener membresía:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

const actualizarSchema = z.object({
  accion: z.enum(["renovar", "suspender", "cancelar", "reactivar"]),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const { id } = await params
    const membresiaId = Number(id)
    if (isNaN(membresiaId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    // ── TENANT ISOLATION: verify membership belongs to this empresa ──
    const existing = await (prisma as any).membresia.findFirst({
      where: { id: membresiaId, cliente: { empresaId: ctx.auth.empresaId } },
      select: { id: true },
    })
    if (!existing) return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 })

    const body = await request.json()
    const { accion } = actualizarSchema.parse(body)

    const { membresiasService } = await import("@/lib/membresias/membresias-service")

    let result
    switch (accion) {
      case "renovar":
        result = await membresiasService.renovarMembresia(existing.id)
        break
      case "suspender":
        result = await membresiasService.suspenderMembresia(existing.id)
        break
      case "cancelar":
        result = await membresiasService.cancelarMembresia(existing.id)
        break
      case "reactivar":
        result = await prisma.membresia.update({
          where: { id: existing.id },
          data: { estado: "activa" },
        })
        break
    }

    return NextResponse.json({ success: true, membresia: result })
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
    }
    console.error("Error al actualizar membresía:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
