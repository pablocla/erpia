import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canManageUsers } from "@/lib/auth/admin-roles"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/password"
import { z } from "zod"

const patchSchema = z.object({
  nombre: z.string().min(2).optional(),
  rol: z.string().min(1).optional(),
  activo: z.boolean().optional(),
  /** Optional password set/reset by admin (works for credentials; for Google becomes hybrid) */
  password: z.string().min(8).optional(),
  /** Force auth method hint when clearing password is not supported via API */
  authProvider: z.enum(["credentials", "google"]).optional(),
})

/**
 * PATCH /api/usuarios/:id — Update user in same empresa
 * PUT  /api/usuarios/:id — alias for PATCH (UI compatibility)
 */
async function updateUser(
  request: NextRequest,
  params: Promise<{ id: string }>,
) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!canManageUsers(ctx.auth.rol)) {
      return NextResponse.json(
        { error: "Solo administradores pueden modificar usuarios" },
        { status: 403 },
      )
    }

    const userId = Number.parseInt((await params).id, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const target = await prisma.usuario.findFirst({
      where: { id: userId, empresaId: ctx.auth.empresaId, deletedAt: null },
    })
    if (!target) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.nombre !== undefined) data.nombre = parsed.data.nombre
    if (parsed.data.rol !== undefined) data.rol = parsed.data.rol
    if (parsed.data.activo !== undefined) {
      // Prevent self-deactivation
      if (userId === ctx.auth.userId && parsed.data.activo === false) {
        return NextResponse.json(
          { error: "No podés desactivar tu propio usuario" },
          { status: 400 },
        )
      }
      data.activo = parsed.data.activo
    }
    if (parsed.data.password) {
      data.password = await hashPassword(parsed.data.password)
      // If they only had Google, become hybrid (credentials + google)
      if (target.authProvider === "google") {
        data.authProvider = "credentials"
      }
    }
    if (parsed.data.authProvider !== undefined) {
      data.authProvider = parsed.data.authProvider
    }

    const usuario = await prisma.usuario.update({
      where: { id: target.id },
      data,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        authProvider: true,
        avatarUrl: true,
        googleId: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      usuario: {
        ...usuario,
        hasGoogle: !!usuario.googleId,
        googleId: undefined,
      },
    })
  } catch (error) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return updateUser(request, params)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return updateUser(request, params)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!canManageUsers(ctx.auth.rol)) {
      return NextResponse.json(
        { error: "Solo administradores pueden eliminar usuarios" },
        { status: 403 },
      )
    }

    const userId = Number.parseInt((await params).id, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    if (userId === ctx.auth.userId) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propio usuario" },
        { status: 400 },
      )
    }

    const target = await prisma.usuario.findFirst({
      where: { id: userId, empresaId: ctx.auth.empresaId },
    })
    if (!target) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Soft-delete when possible
    try {
      await prisma.usuario.update({
        where: { id: target.id },
        data: {
          activo: false,
          deletedAt: new Date(),
          email: `deleted_${target.id}_${target.email}`,
        },
      })
    } catch {
      await prisma.usuario.delete({ where: { id: target.id } })
    }

    return NextResponse.json({
      success: true,
      mensaje: "Usuario eliminado correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}
