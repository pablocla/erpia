import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { AuthService } from "@/lib/auth/auth-service"
import { checkRateLimit } from "@/lib/auth/rate-limiter"
import { z } from "zod"
import crypto from "crypto"

/**
 * POST /api/auth/forgot-password — Request password reset token
 * Generates a secure token, stores it, and returns it (in production, email it).
 */

const forgotSchema = z.object({
  email: z.string().email("Email inválido"),
})

export async function POST(request: NextRequest) {
  const blocked = checkRateLimit(request, "forgot-password", 3, 15 * 60 * 1000)
  if (blocked) return blocked

  try {
    const body = await request.json()
    const { email } = forgotSchema.parse(body)

    // Always return success to prevent email enumeration
    const genericResponse = {
      success: true,
      mensaje: "Si el email existe, recibirás instrucciones para restablecer tu contraseña.",
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: { id: true, activo: true },
    })

    if (!usuario || !usuario.activo) {
      return NextResponse.json(genericResponse)
    }

    // Generate secure reset token (valid 1 hour)
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store token in DB (using LogActividad as a generic store since no dedicated table)
    await prisma.logActividad.create({
      data: {
        accion: "password_reset_token",
        detalle: JSON.stringify({
          token,
          userId: usuario.id,
          expiresAt: expiresAt.toISOString(),
        }),
        usuarioId: usuario.id,
        entidad: "usuario",
        entidadId: usuario.id,
      },
    })

    // In production: send email with reset link
    // For now, return the token for testing/demo
    return NextResponse.json({
      ...genericResponse,
      // Remove resetToken in production (only for dev/demo):
      ...(process.env.NODE_ENV !== "production" && { resetToken: token }),
    })
  } catch (error) {
    console.error("Error en forgot-password:", error)
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 })
  }
}
