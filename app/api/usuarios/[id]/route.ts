import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    // Solo administradores pueden modificar usuarios
    if (ctx.auth.rol !== "administrador") {
      return NextResponse.json({ error: "Solo administradores pueden modificar usuarios" }, { status: 403 })
    }

    const userId = Number.parseInt((await params).id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // ── TENANT ISOLATION: verify target user belongs to same empresa ──
    const target = await prisma.usuario.findFirst({
      where: { id: userId, empresaId: ctx.auth.empresaId },
    })
    if (!target) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const body = await request.json()

    // Whitelist: only allow safe fields — block empresaId, email, etc.
    const usuario = await prisma.usuario.update({
      where: { id: target.id },
      data: {
        ...(body.nombre !== undefined && { nombre: body.nombre }),
        ...(body.rol !== undefined && { rol: body.rol }),
        ...(body.activo !== undefined && { activo: body.activo }),
      },
    })

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
      },
    })
  } catch (error) {
    console.error("Error al actualizar usuario:", error)
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    // Solo administradores pueden eliminar usuarios
    if (ctx.auth.rol !== "administrador") {
      return NextResponse.json({ error: "Solo administradores pueden eliminar usuarios" }, { status: 403 })
    }

    const userId = Number.parseInt((await params).id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    // No permitir que el usuario se elimine a sí mismo
    if (userId === ctx.auth.userId) {
      return NextResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 400 })
    }

    // ── TENANT ISOLATION: verify target user belongs to same empresa ──
    const target = await prisma.usuario.findFirst({
      where: { id: userId, empresaId: ctx.auth.empresaId },
    })
    if (!target) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    await prisma.usuario.delete({
      where: { id: target.id },
    })

    return NextResponse.json({
      success: true,
      mensaje: "Usuario eliminado correctamente",
    })
  } catch (error) {
    console.error("Error al eliminar usuario:", error)
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 })
  }
}
