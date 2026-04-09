import { type NextRequest, NextResponse } from "next/server"
import {
  verificarAutenticacion,
  verificarRol,
  crearRespuestaNoAutorizado,
  crearRespuestaForbidden,
} from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verificarAutenticacion(request)

    if (!auth.autenticado) {
      return crearRespuestaNoAutorizado(auth.error)
    }

    // Solo administradores pueden modificar usuarios
    if (!verificarRol(auth.usuario, ["administrador"])) {
      return crearRespuestaForbidden("Solo administradores pueden modificar usuarios")
    }

    const userId = Number.parseInt(params.id)
    const body = await request.json()

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: {
        nombre: body.nombre,
        rol: body.rol,
        activo: body.activo,
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verificarAutenticacion(request)

    if (!auth.autenticado) {
      return crearRespuestaNoAutorizado(auth.error)
    }

    // Solo administradores pueden eliminar usuarios
    if (!verificarRol(auth.usuario, ["administrador"])) {
      return crearRespuestaForbidden("Solo administradores pueden eliminar usuarios")
    }

    const userId = Number.parseInt(params.id)

    // No permitir que el usuario se elimine a sí mismo
    if (userId === auth.usuario.userId) {
      return NextResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 400 })
    }

    await prisma.usuario.delete({
      where: { id: userId },
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
