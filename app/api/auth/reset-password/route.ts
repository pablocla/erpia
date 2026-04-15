import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/auth/rate-limiter"
import { z } from "zod"
import bcrypt from "bcryptjs"

/**
 * POST /api/auth/reset-password — Reset password using token from forgot-password
 */

const resetSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

export async function POST(request: NextRequest) {
  const blocked = checkRateLimit(request, "reset-password", 5, 15 * 60 * 1000)
  if (blocked) return blocked

  try {
    const body = await request.json()
    const { token, password } = resetSchema.parse(body)

    // Find the reset token in log
    const logs = await prisma.logActividad.findMany({
      where: { accion: "password_reset_token" },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    let userId: number | null = null
    let logId: number | null = null

    for (const log of logs) {
      try {
        const data = JSON.parse(log.detalle || "{}")
        if (data.token === token) {
          const expiresAt = new Date(data.expiresAt)
          if (expiresAt > new Date()) {
            userId = data.userId
            logId = log.id
          }
          break
        }
      } catch {
        continue
      }
    }

    if (!userId || !logId) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 })
    }

    // Verify user exists and is active
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, activo: true },
    })

    if (!usuario || !usuario.activo) {
      return NextResponse.json({ error: "Usuario no encontrado o inactivo" }, { status: 400 })
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.usuario.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Invalidate the token (mark used)
    await prisma.logActividad.update({
      where: { id: logId },
      data: { detalle: JSON.stringify({ used: true, usedAt: new Date().toISOString() }) },
    })

    return NextResponse.json({
      success: true,
      mensaje: "Contraseña restablecida correctamente. Ya puedes iniciar sesión.",
    })
  } catch (error) {
    console.error("Error en reset-password:", error)
    return NextResponse.json({ error: "Error al restablecer contraseña" }, { status: 500 })
  }
}
