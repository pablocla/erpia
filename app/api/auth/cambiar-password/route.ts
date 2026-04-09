import { type NextRequest, NextResponse } from "next/server"
import { verificarAutenticacion, crearRespuestaNoAutorizado } from "@/lib/auth/middleware"
import { AuthService } from "@/lib/auth/auth-service"
import { z } from "zod"

const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, "La contraseña actual es requerida"),
  passwordNueva: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
})

export async function POST(request: NextRequest) {
  try {
    const auth = verificarAutenticacion(request)

    if (!auth.autenticado) {
      return crearRespuestaNoAutorizado(auth.error)
    }

    const body = await request.json()

    // Validar datos
    const validacion = cambiarPasswordSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { passwordActual, passwordNueva } = validacion.data

    const authService = new AuthService()
    const resultado = await authService.cambiarPassword(auth.usuario.userId, passwordActual, passwordNueva)

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      mensaje: "Contraseña cambiada correctamente",
    })
  } catch (error) {
    console.error("Error al cambiar contraseña:", error)
    return NextResponse.json({ error: "Error al cambiar contraseña" }, { status: 500 })
  }
}
