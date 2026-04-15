import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth/auth-service"
import { verificarToken } from "@/lib/auth/middleware"
import { z } from "zod"

const registroSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  rol: z.enum(["administrador", "contador", "vendedor"]),
  empresaId: z.number().int().positive().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Solo administradores pueden crear nuevos usuarios
    const solicitante = await verificarToken(request)
    if (!solicitante || solicitante.rol !== "administrador") {
      return NextResponse.json({ error: "Solo administradores pueden registrar usuarios" }, { status: 403 })
    }

    const body = await request.json()

    const validacion = registroSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const { nombre, email, password, rol } = validacion.data
    // Use empresaId from body if provided, fallback to the admin's own empresaId
    const empresaId = validacion.data.empresaId || solicitante.empresaId

    const authService = new AuthService()
    const resultado = await authService.registrarUsuario(nombre, email, password, rol, empresaId)

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      usuario: resultado.usuario,
    })
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 })
  }
}
