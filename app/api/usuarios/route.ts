import { type NextRequest, NextResponse } from "next/server"
import {
  verificarAutenticacion,
  verificarRol,
  crearRespuestaNoAutorizado,
  crearRespuestaForbidden,
} from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const auth = verificarAutenticacion(request)

    if (!auth.autenticado) {
      return crearRespuestaNoAutorizado(auth.error)
    }

    // Solo administradores pueden listar usuarios
    if (!verificarRol(auth.usuario, ["administrador"])) {
      return crearRespuestaForbidden("Solo administradores pueden listar usuarios")
    }

    const usuarios = await prisma.usuario.findMany({
      where: {
        empresaId: auth.usuario.empresaId,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      success: true,
      usuarios,
    })
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}
