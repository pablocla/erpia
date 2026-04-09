import { type NextRequest, NextResponse } from "next/server"
import { verificarAutenticacion, crearRespuestaNoAutorizado } from "@/lib/auth/middleware"
import { AuthService } from "@/lib/auth/auth-service"

export async function GET(request: NextRequest) {
  try {
    const auth = verificarAutenticacion(request)

    if (!auth.autenticado) {
      return crearRespuestaNoAutorizado(auth.error)
    }

    const authService = new AuthService()
    const usuario = await authService.obtenerUsuario(auth.usuario.userId)

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      usuario,
    })
  } catch (error) {
    console.error("Error al obtener usuario:", error)
    return NextResponse.json({ error: "Error al obtener usuario" }, { status: 500 })
  }
}
