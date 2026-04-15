import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { AuthService } from "@/lib/auth/auth-service"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"

/**
 * POST /api/auth/invite — Admin invites a new team member
 * Creates an inactive user with an invitation token.
 * The invited user clicks the link, sets their password, and activates.
 *
 * GET /api/auth/invite?token=xxx — Verify invitation token
 * PATCH /api/auth/invite — Accept invitation: set password + activate
 */

const inviteSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  rol: z.enum(["administrador", "contador", "vendedor", "cajero"]),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (ctx.auth.rol !== "admin" && ctx.auth.rol !== "administrador") {
      return NextResponse.json({ error: "Solo administradores pueden invitar usuarios" }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, email, rol } = inviteSchema.parse(body)

    // Check if user already exists
    const existing = await prisma.usuario.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 })
    }

    // Create user with placeholder password (inactive until accepted)
    const inviteToken = crypto.randomBytes(32).toString("hex")
    const tempPassword = crypto.randomBytes(16).toString("hex")

    const bcrypt = await import("bcryptjs")
    const hashed = await bcrypt.hash(tempPassword, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashed,
        rol,
        empresaId: ctx.auth.empresaId,
        activo: false, // inactive until invitation accepted
      },
    })

    // Store invitation token
    await prisma.logActividad.create({
      data: {
        accion: "user_invitation",
        detalle: JSON.stringify({
          token: inviteToken,
          userId: usuario.id,
          invitedBy: ctx.auth.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        }),
        usuarioId: ctx.auth.userId,
        entidad: "usuario",
        entidadId: usuario.id,
      },
    })

    // In production: send invitation email
    return NextResponse.json({
      success: true,
      mensaje: `Invitación enviada a ${email}`,
      usuario: { id: usuario.id, nombre, email, rol },
      // Remove inviteToken in production (only for dev/demo):
      ...(process.env.NODE_ENV !== "production" && { inviteToken }),
    })
  } catch (error) {
    console.error("Error al invitar usuario:", error)
    return NextResponse.json({ error: "Error al invitar usuario" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 })
    }

    const logs = await prisma.logActividad.findMany({
      where: { accion: "user_invitation" },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    for (const log of logs) {
      try {
        const data = JSON.parse(log.detalle || "{}")
        if (data.token === token) {
          if (new Date(data.expiresAt) < new Date()) {
            return NextResponse.json({ error: "Invitación expirada" }, { status: 410 })
          }
          const usuario = await prisma.usuario.findUnique({
            where: { id: data.userId },
            select: { id: true, nombre: true, email: true, rol: true, activo: true },
          })
          if (!usuario) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
          }
          if (usuario.activo) {
            return NextResponse.json({ error: "Invitación ya aceptada" }, { status: 409 })
          }
          return NextResponse.json({ success: true, usuario })
        }
      } catch {
        continue
      }
    }

    return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 })
  } catch (error) {
    console.error("Error al verificar invitación:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

const acceptSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = acceptSchema.parse(body)

    const logs = await prisma.logActividad.findMany({
      where: { accion: "user_invitation" },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    let userId: number | null = null
    let logId: number | null = null

    for (const log of logs) {
      try {
        const data = JSON.parse(log.detalle || "{}")
        if (data.token === token && new Date(data.expiresAt) > new Date()) {
          userId = data.userId
          logId = log.id
          break
        }
      } catch {
        continue
      }
    }

    if (!userId || !logId) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 })
    }

    const bcrypt = await import("bcryptjs")
    const hashed = await bcrypt.hash(password, 10)

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: { password: hashed, activo: true },
      select: { id: true, nombre: true, email: true, rol: true, empresaId: true },
    })

    // Invalidate invitation token
    await prisma.logActividad.update({
      where: { id: logId },
      data: { detalle: JSON.stringify({ accepted: true, acceptedAt: new Date().toISOString() }) },
    })

    // Generate login token
    const authService = new AuthService()
    const loginToken = await authService.generarToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      empresaId: usuario.empresaId,
    })

    return NextResponse.json({
      success: true,
      token: loginToken,
      usuario,
      mensaje: "¡Bienvenido! Tu cuenta ha sido activada.",
    })
  } catch (error) {
    console.error("Error al aceptar invitación:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
