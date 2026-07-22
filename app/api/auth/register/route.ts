import { type NextRequest, NextResponse } from "next/server"
import { AuthService } from "@/lib/auth/auth-service"
import { verificarToken } from "@/lib/auth/middleware"
import { canManageUsers } from "@/lib/auth/admin-roles"
import { provisionGoogleUser } from "@/lib/auth/google-auth-service"
import { z } from "zod"

const registroSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").optional(),
  rol: z.string().min(1),
  empresaId: z.number().int().positive().optional(),
  authMethod: z.enum(["credentials", "google"]).optional().default("credentials"),
})

/**
 * POST /api/auth/register — Admin creates a user in their empresa
 * Supports credentials (password) or Google-only (no password).
 */
export async function POST(request: NextRequest) {
  try {
    const solicitante = await verificarToken(request)
    if (!solicitante || !canManageUsers(solicitante.rol)) {
      return NextResponse.json(
        { error: "Solo administradores pueden registrar usuarios" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const validacion = registroSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: validacion.error.errors },
        { status: 400 },
      )
    }

    const { nombre, email, password, rol, authMethod } = validacion.data
    const empresaId = validacion.data.empresaId || solicitante.empresaId

    // Tenant isolation: admins can only create in their own empresa
    if (empresaId !== solicitante.empresaId) {
      return NextResponse.json(
        { error: "No podés registrar usuarios en otra empresa" },
        { status: 403 },
      )
    }

    if (authMethod === "google") {
      const result = await provisionGoogleUser({
        nombre,
        email,
        rol,
        empresaId,
        invitedBy: solicitante.userId,
        activateImmediately: false,
      })
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }
      return NextResponse.json({
        success: true,
        usuario: result.usuario,
        authMethod: "google",
        mensaje: "Usuario Google creado. Se activa al primer login con Google.",
        ...(result.inviteToken && { inviteToken: result.inviteToken }),
      })
    }

    if (!password) {
      return NextResponse.json(
        { error: "La contraseña es obligatoria para authMethod credentials" },
        { status: 400 },
      )
    }

    const authService = new AuthService()
    const resultado = await authService.registrarUsuario(nombre, email, password, rol, empresaId)

    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      usuario: resultado.usuario,
      authMethod: "credentials",
    })
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ error: "Error al registrar usuario" }, { status: 500 })
  }
}
