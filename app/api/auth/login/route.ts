import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth/auth-service"
import { z } from "zod"
import { checkRateLimit } from "@/lib/auth/rate-limiter"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
})

export async function POST(request: NextRequest) {
  try {
    const blocked = checkRateLimit(request, "login", 5, 15 * 60 * 1000)
    if (blocked) return blocked

    const body = await request.json()

    const validacion = loginSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { email, password } = validacion.data

    const authService = new AuthService()
    const resultado = await authService.login(email, password)

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 401 })
    }

    // Reset counter on successful login
    loginAttempts.delete(ip)

    return NextResponse.json({
      success: true,
      token: resultado.token,
      usuario: resultado.usuario,
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
