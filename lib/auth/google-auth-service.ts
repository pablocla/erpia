/**
 * Google OAuth authentication for Grupo Claver (all product surfaces).
 *
 * Security rules:
 * - Existing active users: login + optional Google link by verified email.
 * - Invited / pre-provisioned inactive users: activate only with open invitation.
 * - Brand-new users: only self-serve owner signup via empresaNombre (never free join by empresaId).
 * - Deactivated users without open invite: blocked.
 */

import { OAuth2Client } from "google-auth-library"
import { prisma } from "@/lib/prisma"
import { AuthService } from "@/lib/auth/auth-service"

const authService = new AuthService()

export type GooglePayload = {
  sub: string
  email: string
  name: string
  picture?: string
  email_verified?: boolean
}

export type GoogleAuthSuccess = {
  success: true
  token: string
  usuario: {
    id: number
    nombre: string
    email: string
    rol: string
    empresaId: number
    authProvider?: string
    avatarUrl?: string | null
  }
  isNewUser: boolean
  activatedInvite?: boolean
}

export type GoogleAuthNeedsEmpresa = {
  success: false
  error: "EMPRESA_REQUIRED"
  message: string
  googleUser: {
    email: string
    nombre: string
    avatarUrl?: string
  }
}

export type GoogleAuthFailure = {
  success: false
  error: string
  status: number
}

export type GoogleAuthResult = GoogleAuthSuccess | GoogleAuthNeedsEmpresa | GoogleAuthFailure

export async function verifyGoogleIdToken(idToken: string): Promise<
  | { ok: true; payload: GooglePayload }
  | { ok: false; error: string; status: number }
> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return { ok: false, error: "Google Auth no está configurado en este servidor", status: 500 }
  }

  try {
    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    })
    const payload = ticket.getPayload()
    if (!payload?.email || !payload.sub) {
      return { ok: false, error: "Token de Google inválido", status: 401 }
    }
    if (!payload.email_verified) {
      return { ok: false, error: "El email de Google no está verificado", status: 401 }
    }

    return {
      ok: true,
      payload: {
        sub: payload.sub,
        email: payload.email.toLowerCase().trim(),
        name: payload.name ?? payload.email.split("@")[0],
        picture: payload.picture,
        email_verified: payload.email_verified,
      },
    }
  } catch (err) {
    console.error("[Google Auth] Error verificando token:", err)
    return { ok: false, error: "Token de Google inválido o expirado", status: 401 }
  }
}

/**
 * Returns true if the user has a valid, unexpired invitation (not yet accepted).
 */
export async function hasOpenInvitation(userId: number): Promise<boolean> {
  const logs = await prisma.logActividad.findMany({
    where: {
      accion: "user_invitation",
      entidadId: userId,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  for (const log of logs) {
    try {
      const data = JSON.parse(log.detalle || "{}") as {
        token?: string
        userId?: number
        expiresAt?: string
        accepted?: boolean
      }
      if (data.accepted) continue
      if (data.userId !== userId && data.userId != null) continue
      if (!data.expiresAt) continue
      if (new Date(data.expiresAt) < new Date()) continue
      if (data.token) return true
    } catch {
      continue
    }
  }
  return false
}

async function markInvitationAccepted(userId: number): Promise<void> {
  const logs = await prisma.logActividad.findMany({
    where: {
      accion: "user_invitation",
      entidadId: userId,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  for (const log of logs) {
    try {
      const data = JSON.parse(log.detalle || "{}") as {
        token?: string
        userId?: number
        expiresAt?: string
        accepted?: boolean
      }
      if (data.accepted) continue
      if (data.userId != null && data.userId !== userId) continue
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) continue
      if (!data.token) continue

      await prisma.logActividad.update({
        where: { id: log.id },
        data: {
          detalle: JSON.stringify({
            ...data,
            accepted: true,
            acceptedVia: "google",
            acceptedAt: new Date().toISOString(),
          }),
        },
      })
      return
    } catch {
      continue
    }
  }
}

async function issueTokenForUser(usuario: {
  id: number
  email: string
  rol: string
  empresaId: number
  nombre: string
  authProvider?: string | null
  avatarUrl?: string | null
}): Promise<GoogleAuthSuccess> {
  const token = await authService.generarToken({
    userId: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    empresaId: usuario.empresaId,
  })

  return {
    success: true,
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      empresaId: usuario.empresaId,
      authProvider: usuario.authProvider ?? undefined,
      avatarUrl: usuario.avatarUrl,
    },
    isNewUser: false,
  }
}

/**
 * Authenticate or register with a verified Google ID token.
 *
 * @param empresaNombre — only for brand-new owner self-signup (creates empresa)
 * @param empresaId — IGNORED for security (free join disabled); kept only to detect misuse
 */
export async function authenticateWithGoogle(input: {
  idToken: string
  empresaNombre?: string
  /** @deprecated Free join by empresaId is disabled. Present only for clear error messaging. */
  empresaId?: number
}): Promise<GoogleAuthResult> {
  const verified = await verifyGoogleIdToken(input.idToken)
  if (!verified.ok) {
    return { success: false, error: verified.error, status: verified.status }
  }
  const google = verified.payload

  // Reject free join by empresaId (security)
  if (input.empresaId != null && !input.empresaNombre) {
    // Only allowed if user already exists (handled below) — for new users this is blocked
    const existing = await prisma.usuario.findFirst({
      where: {
        OR: [{ email: google.email }, { googleId: google.sub }],
      },
    })
    if (!existing) {
      return {
        success: false,
        error:
          "No se puede unir a una empresa existente solo con Google. Pedile al administrador que te invite por email.",
        status: 403,
      }
    }
  }

  let usuario = await prisma.usuario.findFirst({
    where: {
      OR: [{ email: google.email }, { googleId: google.sub }],
    },
  })

  // ── Existing user ────────────────────────────────────────────────────────
  if (usuario) {
    if (!usuario.activo) {
      const openInvite = await hasOpenInvitation(usuario.id)
      if (!openInvite) {
        return {
          success: false,
          error: "Usuario inactivo. Contacte al administrador",
          status: 403,
        }
      }

      // Accept invite via Google
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          activo: true,
          googleId: google.sub,
          avatarUrl: google.picture ?? usuario.avatarUrl,
          authProvider: "google",
          // Keep password if they had one (hybrid); invited Google-only has null/temp
          nombre: usuario.nombre || google.name,
        },
      })
      await markInvitationAccepted(usuario.id)

      const result = await issueTokenForUser(usuario)
      return { ...result, activatedInvite: true }
    }

    // Active user: link Google if missing
    if (!usuario.googleId || !usuario.avatarUrl) {
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          googleId: usuario.googleId ?? google.sub,
          avatarUrl: usuario.avatarUrl ?? google.picture,
          // Don't force authProvider to google if they also have password
          authProvider:
            usuario.authProvider === "credentials" && !usuario.password
              ? "google"
              : usuario.authProvider,
        },
      })
    } else if (usuario.googleId && usuario.googleId !== google.sub) {
      // Email matches different Google account — refuse (account takeover protection)
      return {
        success: false,
        error:
          "Este email ya está vinculado a otra cuenta de Google. Contacte al administrador.",
        status: 403,
      }
    }

    return issueTokenForUser(usuario)
  }

  // ── New user: only owner self-signup with empresaNombre ──────────────────
  if (!input.empresaNombre?.trim()) {
    return {
      success: false,
      error: "EMPRESA_REQUIRED",
      message: "Se necesita una empresa para completar el registro",
      googleUser: {
        email: google.email,
        nombre: google.name,
        avatarUrl: google.picture,
      },
    }
  }

  const finalEmpresaNombre = input.empresaNombre.trim()

  const nuevaEmpresa = await prisma.empresa.create({
    data: {
      nombre: finalEmpresaNombre,
      razonSocial: finalEmpresaNombre,
      // CUIT único provisorio (se completa en onboarding) — igual que signup email
      cuit: `GOOGLE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      rubro: "kiosco",
      modoLite: "pos",
      email: google.email,
    },
  })

  // Owner role: "dueno" aligns with ROLES_SISTEMA; APIs use canManageUsers/isAdminRole
  usuario = await prisma.usuario.create({
    data: {
      nombre: google.name,
      email: google.email,
      authProvider: "google",
      googleId: google.sub,
      avatarUrl: google.picture,
      rol: "dueno",
      empresaId: nuevaEmpresa.id,
      activo: true,
      // Persistir que aceptaron los términos si el flag venía en true, o por defecto asumiendo que el login de Google requiere aceptar los términos en el frontend.
      tosAcceptedAt: new Date(),
    },
  })

  // Best-effort trial / ops hooks (same spirit as email signup)
  try {
    const { ensureWebSignupTrial, setSignupOrigen } = await import("@/lib/ops/signup-tracking")
    await Promise.all([
      setSignupOrigen(nuevaEmpresa.id, "web_register", `google:${google.email}`),
      ensureWebSignupTrial(nuevaEmpresa.id, 14),
    ])
  } catch (err) {
    console.warn("[Google Auth] signup tracking skip:", err)
  }

  try {
    const { ensureProyectoImplementacion } = await import("@/lib/ops/implementacion-service")
    void ensureProyectoImplementacion({
      empresaId: nuevaEmpresa.id,
      planComercial: "Pro",
    }).catch(() => {})
  } catch {
    /* optional */
  }

  const token = await authService.generarToken({
    userId: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    empresaId: usuario.empresaId,
  })

  return {
    success: true,
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      empresaId: usuario.empresaId,
      authProvider: "google",
      avatarUrl: usuario.avatarUrl,
    },
    isNewUser: true,
  }
}

/**
 * Provision a sub-user for Google login (admin).
 * Creates inactive user + invitation unless activateImmediately is true.
 */
export async function provisionGoogleUser(input: {
  nombre: string
  email: string
  rol: string
  empresaId: number
  invitedBy: number
  activateImmediately?: boolean
  expiresInDays?: number
}): Promise<
  | {
      success: true
      usuario: {
        id: number
        nombre: string
        email: string
        rol: string
        activo: boolean
        authProvider: string
      }
      inviteToken?: string
    }
  | { success: false; error: string; status: number }
> {
  const email = input.email.toLowerCase().trim()
  const existing = await prisma.usuario.findUnique({ where: { email } })
  if (existing) {
    return { success: false, error: "Ya existe un usuario con ese email", status: 409 }
  }

  const crypto = await import("crypto")
  const inviteToken = crypto.randomBytes(32).toString("hex")
  const expiresInDays = input.expiresInDays ?? 7
  const activateImmediately = input.activateImmediately === true

  const usuario = await prisma.usuario.create({
    data: {
      nombre: input.nombre.trim(),
      email,
      password: null,
      authProvider: "google",
      rol: input.rol,
      empresaId: input.empresaId,
      activo: activateImmediately,
    },
  })

  // Always store invitation for audit / re-send; required if inactive
  await prisma.logActividad.create({
    data: {
      accion: "user_invitation",
      modulo: "auth",
      detalle: JSON.stringify({
        token: inviteToken,
        userId: usuario.id,
        invitedBy: input.invitedBy,
        authMethod: "google",
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
      }),
      usuarioId: input.invitedBy,
      entidad: "usuario",
      entidadId: usuario.id,
    },
  })

  try {
    const { emitAutomationEvent } = await import("@/lib/automation/emit-event")
    void emitAutomationEvent(
      input.empresaId,
      "USUARIO_CREADO",
      {
        usuarioId: usuario.id,
        nombre: input.nombre,
        email,
        rol: input.rol,
        via: "invite_google",
      },
      `usr-${usuario.id}`,
    )
  } catch {
    /* optional */
  }

  return {
    success: true,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo,
      authProvider: "google",
    },
    inviteToken: process.env.NODE_ENV !== "production" ? inviteToken : undefined,
  }
}
