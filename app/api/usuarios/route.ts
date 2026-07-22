import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { canManageUsers, isAssignableRole } from "@/lib/auth/admin-roles"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/password"
import { provisionGoogleUser } from "@/lib/auth/google-auth-service"
import { z } from "zod"

const createUserSchema = z.object({
  nombre: z.string().min(2),
  email: z.string().email(),
  rol: z.string().min(1),
  /** credentials (default) | google */
  authMethod: z.enum(["credentials", "google"]).optional().default("credentials"),
  password: z.string().min(8).optional(),
  /** If true and authMethod=google, user can login immediately without invite accept */
  activo: z.boolean().optional(),
})

const userSelect = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  activo: true,
  authProvider: true,
  googleId: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
} as const

/**
 * GET /api/usuarios — List users for current empresa (user managers only)
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!canManageUsers(ctx.auth.rol)) {
      return NextResponse.json(
        { error: "Solo administradores pueden listar usuarios" },
        { status: 403 },
      )
    }

    const usuarios = await prisma.usuario.findMany({
      where: {
        empresaId: ctx.auth.empresaId,
        deletedAt: null,
      },
      select: userSelect,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      usuarios: usuarios.map(({ googleId, ...u }) => ({
        ...u,
        hasGoogle: !!googleId,
      })),
    })
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

/**
 * POST /api/usuarios — Create sub-user (credentials or Google-only)
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    if (!canManageUsers(ctx.auth.rol)) {
      return NextResponse.json(
        { error: "Solo administradores pueden crear usuarios" },
        { status: 403 },
      )
    }

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { nombre, email, rol, authMethod, password, activo } = parsed.data

    if (!isAssignableRole(rol) && rol !== "dueno" && rol !== "administrador") {
      // Allow dueno/administrador for co-owners; block unknown roles
      return NextResponse.json({ error: `Rol no permitido: ${rol}` }, { status: 400 })
    }

    // ── Google-only sub-user ───────────────────────────────────────────────
    if (authMethod === "google") {
      const result = await provisionGoogleUser({
        nombre,
        email,
        rol,
        empresaId: ctx.auth.empresaId,
        invitedBy: ctx.auth.userId,
        activateImmediately: activo === true,
      })
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.status })
      }
      return NextResponse.json(
        {
          success: true,
          usuario: result.usuario,
          inviteToken: result.inviteToken,
          mensaje:
            activo === true
              ? "Usuario Google creado. Puede iniciar sesión con Google de inmediato."
              : "Invitación Google creada. El usuario se activa al primer login con Google.",
        },
        { status: 201 },
      )
    }

    // ── Credentials ────────────────────────────────────────────────────────
    if (!password) {
      return NextResponse.json(
        { error: "Contraseña obligatoria para usuarios con email/contraseña" },
        { status: 400 },
      )
    }

    const emailNorm = email.toLowerCase().trim()
    const existing = await prisma.usuario.findUnique({ where: { email: emailNorm } })
    if (existing) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 })
    }

    const hashed = await hashPassword(password)
    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        email: emailNorm,
        password: hashed,
        authProvider: "credentials",
        rol,
        empresaId: ctx.auth.empresaId,
        activo: activo !== false,
      },
      select: userSelect,
    })

    try {
      const { emitAutomationEvent } = await import("@/lib/automation/emit-event")
      void emitAutomationEvent(
        ctx.auth.empresaId,
        "USUARIO_CREADO",
        {
          usuarioId: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
          via: "admin_create",
        },
        `usr-${usuario.id}`,
      )
    } catch {
      /* optional */
    }

    const { googleId, ...safeUser } = usuario
    return NextResponse.json(
      {
        success: true,
        usuario: {
          ...safeUser,
          hasGoogle: !!googleId,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 })
  }
}
