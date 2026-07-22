import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canManageUsers, isAssignableRole } from "@/lib/auth/admin-roles"
import { AuthService } from "@/lib/auth/auth-service"
import { provisionGoogleUser } from "@/lib/auth/google-auth-service"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import crypto from "crypto"

/**
 * POST /api/auth/invite — Admin invites a new team member
 * GET  /api/auth/invite?token=xxx — Verify invitation token
 * PATCH /api/auth/invite — Accept invitation (password) OR { token, idToken } for Google
 */

const inviteSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  rol: z.string().min(1),
  /** credentials (default) | google */
  authMethod: z.enum(["credentials", "google"]).optional().default("credentials"),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!canManageUsers(ctx.auth.rol)) {
      return NextResponse.json(
        { error: "Solo administradores pueden invitar usuarios" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { nombre, email, rol, authMethod } = parsed.data
    if (!isAssignableRole(rol) && rol !== "dueno" && rol !== "administrador") {
      return NextResponse.json({ error: `Rol no permitido: ${rol}` }, { status: 400 })
    }

    // ── Google invitation ──────────────────────────────────────────────────
    if (authMethod === "google") {
      const result = await provisionGoogleUser({
        nombre,
        email,
        rol,
        empresaId: ctx.auth.empresaId,
        invitedBy: ctx.auth.userId,
        activateImmediately: false,
      })
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }
      return NextResponse.json({
        success: true,
        mensaje: `Invitación Google enviada a ${email}. Se activa al iniciar sesión con Google.`,
        usuario: result.usuario,
        authMethod: "google",
        ...(result.inviteToken && { inviteToken: result.inviteToken }),
      })
    }

    // ── Credentials invitation ─────────────────────────────────────────────
    const emailNorm = email.toLowerCase().trim()
    const existing = await prisma.usuario.findUnique({ where: { email: emailNorm } })
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 })
    }

    const inviteToken = crypto.randomBytes(32).toString("hex")
    const tempPassword = crypto.randomBytes(16).toString("hex")
    const bcrypt = await import("bcryptjs")
    const hashed = await bcrypt.hash(tempPassword, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        email: emailNorm,
        password: hashed,
        authProvider: "credentials",
        rol,
        empresaId: ctx.auth.empresaId,
        activo: false,
      },
    })

    try {
      const { emitAutomationEvent } = await import("@/lib/automation/emit-event")
      void emitAutomationEvent(
        ctx.auth.empresaId,
        "USUARIO_CREADO",
        { usuarioId: usuario.id, nombre, email: emailNorm, rol, via: "invite" },
        `usr-${usuario.id}`,
      )
    } catch {
      /* optional */
    }

    await prisma.logActividad.create({
      data: {
        accion: "user_invitation",
        modulo: "auth",
        detalle: JSON.stringify({
          token: inviteToken,
          userId: usuario.id,
          invitedBy: ctx.auth.userId,
          authMethod: "credentials",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        usuarioId: ctx.auth.userId,
        entidad: "usuario",
        entidadId: usuario.id,
      },
    })

    return NextResponse.json({
      success: true,
      mensaje: `Invitación enviada a ${emailNorm}`,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        authProvider: "credentials",
        activo: false,
      },
      authMethod: "credentials",
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
        const data = JSON.parse(log.detalle || "{}") as {
          token?: string
          userId?: number
          expiresAt?: string
          accepted?: boolean
          authMethod?: string
        }
        if (data.token !== token) continue
        if (data.accepted) {
          return NextResponse.json({ error: "Invitación ya aceptada" }, { status: 409 })
        }
        if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
          return NextResponse.json({ error: "Invitación expirada" }, { status: 410 })
        }
        const usuario = await prisma.usuario.findUnique({
          where: { id: data.userId },
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            activo: true,
            authProvider: true,
          },
        })
        if (!usuario) {
          return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
        }
        if (usuario.activo) {
          return NextResponse.json({ error: "Invitación ya aceptada" }, { status: 409 })
        }
        return NextResponse.json({
          success: true,
          usuario,
          authMethod: data.authMethod ?? usuario.authProvider ?? "credentials",
        })
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

const acceptSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8).optional(),
    /** Accept Google invite: client sends Google ID token instead of password */
    idToken: z.string().min(1).optional(),
  })
  .refine((d) => d.password || d.idToken, {
    message: "Se requiere password o idToken de Google",
  })

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = acceptSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }
    const { token, password, idToken } = parsed.data

    // ── Accept via Google ──────────────────────────────────────────────────
    if (idToken) {
      // Verify invite token first, then authenticateWithGoogle will activate by email
      const logs = await prisma.logActividad.findMany({
        where: { accion: "user_invitation" },
        orderBy: { createdAt: "desc" },
        take: 100,
      })

      let invitedUserId: number | null = null
      for (const log of logs) {
        try {
          const data = JSON.parse(log.detalle || "{}") as {
            token?: string
            userId?: number
            expiresAt?: string
            accepted?: boolean
          }
          if (data.token === token && !data.accepted && data.expiresAt && new Date(data.expiresAt) > new Date()) {
            invitedUserId = data.userId ?? null
            break
          }
        } catch {
          continue
        }
      }

      if (!invitedUserId) {
        return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 })
      }

      const { authenticateWithGoogle } = await import("@/lib/auth/google-auth-service")
      const result = await authenticateWithGoogle({ idToken })
      if (!result.success) {
        if (result.error === "EMPRESA_REQUIRED") {
          return NextResponse.json(
            {
              error:
                "El email de Google no coincide con la invitación. Usá la cuenta de Google invitada.",
            },
            { status: 403 },
          )
        }
        return NextResponse.json(
          { error: result.error },
          { status: "status" in result ? result.status : 400 },
        )
      }

      if (result.usuario.id !== invitedUserId) {
        return NextResponse.json(
          {
            error:
              "El email de Google no coincide con la invitación. Usá la cuenta de Google del email invitado.",
          },
          { status: 403 },
        )
      }

      return NextResponse.json({
        success: true,
        token: result.token,
        usuario: result.usuario,
        mensaje: "¡Bienvenido! Tu cuenta fue activada con Google.",
      })
    }

    // ── Accept via password ────────────────────────────────────────────────
    const logs = await prisma.logActividad.findMany({
      where: { accion: "user_invitation" },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    let userId: number | null = null
    let logId: number | null = null

    for (const log of logs) {
      try {
        const data = JSON.parse(log.detalle || "{}") as {
          token?: string
          userId?: number
          expiresAt?: string
          accepted?: boolean
        }
        if (data.token === token && !data.accepted && data.expiresAt && new Date(data.expiresAt) > new Date()) {
          userId = data.userId ?? null
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

    if (!password) {
      return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 })
    }

    const bcrypt = await import("bcryptjs")
    const hashed = await bcrypt.hash(password, 10)

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: {
        password: hashed,
        activo: true,
        authProvider: "credentials",
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        empresaId: true,
        authProvider: true,
      },
    })

    await prisma.logActividad.update({
      where: { id: logId },
      data: {
        detalle: JSON.stringify({
          accepted: true,
          acceptedVia: "password",
          acceptedAt: new Date().toISOString(),
        }),
      },
    })

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
