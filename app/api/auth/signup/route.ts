import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { AuthService } from "@/lib/auth/auth-service"
import { checkRateLimit } from "@/lib/auth/rate-limiter"
import { ensureProyectoImplementacion } from "@/lib/ops/implementacion-service"
import { syncPipelineFromEvent } from "@/lib/comercial/comercial-funnel-service"
import { ensureWebSignupTrial, setSignupOrigen } from "@/lib/ops/signup-tracking"
import { z } from "zod"

const signupSchema = z.object({
  empresa: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  activar: z.string().optional(),
  /** Código de partner: /login/register?ref=CONTADOR_PEREZ */
  ref: z.string().max(40).optional(),
  /** Oleada 0: aceptación de Términos y Privacidad */
  acceptTerms: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const blocked = checkRateLimit(request, "signup", 5, 60 * 60 * 1000)
    if (blocked) return blocked

    const body = await request.json()
    const validacion = signupSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: validacion.error.errors },
        { status: 400 },
      )
    }

    const { empresa: nombreEmpresa, nombre, email, password, activar, ref, acceptTerms } =
      validacion.data

    const { resolveSignupProfile } = await import("@/lib/comercial/rubro-signup")
    const { resolveActivarIntent } = await import("@/lib/comercial/activar-intent")
    const signupProfile = resolveSignupProfile(activar)
    const intentAlta = resolveActivarIntent(activar || signupProfile.activarKey)
    const rubroAlta = signupProfile.rubroEmpresa
    const modoLiteAlta = intentAlta?.modoLite ?? signupProfile.modoLite

    if (acceptTerms !== true) {
      return NextResponse.json(
        {
          error:
            "Debés aceptar los Términos y condiciones y la Política de privacidad para crear la cuenta",
        },
        { status: 400 },
      )
    }

    // Verificar que el email no esté en uso
    const usuarioExistente = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM usuarios WHERE email = ${email} LIMIT 1
    `
    if (usuarioExistente.length > 0) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
    }

    // Crear empresa usando SQL crudo (evita problemas con columnas nuevas no migradas)
    const empresaCreada = await prisma.$queryRaw<{ id: number }[]>`
      INSERT INTO empresas ("nombre", "razonSocial", "cuit", "email", "rubro", "modoLite", "createdAt", "updatedAt")
      VALUES (
        ${nombreEmpresa},
        ${nombreEmpresa},
        ${`DEMO-${Date.now()}`},
        ${email},
        ${rubroAlta},
        ${modoLiteAlta},
        NOW(), NOW()
      )
      RETURNING id
    `
    const empresaId = empresaCreada[0].id

    // Crear usuario admin de la empresa
    const hashedPassword = await bcrypt.hash(password, 10)
    await prisma.$executeRaw`
      INSERT INTO usuarios ("nombre", "email", "password", "rol", "activo", "empresaId", "createdAt", "updatedAt")
      VALUES (${nombre}, ${email}, ${hashedPassword}, 'administrador', true, ${empresaId}, NOW(), NOW())
    `

    // Obtener el usuario recién creado para generar token
    const usuarioRows = await prisma.$queryRaw<{
      id: number; nombre: string; email: string; rol: string; empresaId: number
    }[]>`
      SELECT id, nombre, email, rol, "empresaId" FROM usuarios WHERE email = ${email} LIMIT 1
    `
    const usuario = usuarioRows[0]

    await Promise.all([
      setSignupOrigen(empresaId, "web_register", `email:${email}`),
      ensureWebSignupTrial(empresaId, 14),
    ])

    try {
      const { persistTosAcceptance } = await import("@/lib/ops/commercial-go-live-checklist")
      await persistTosAcceptance({ empresaId, email })
    } catch (err) {
      console.warn("[signup] tos_accepted no persistido:", err)
    }

    // Afiliado multi-nivel: ?ref=CODIGO
    if (ref?.trim()) {
      try {
        const { assignReferralToEmpresa } = await import("@/lib/partners/affiliate-service")
        const r = await assignReferralToEmpresa(empresaId, ref)
        if (r.assigned) {
          await setSignupOrigen(empresaId, "partner_ref", `ref:${ref.trim()}|partner:${r.partnerId}`)
        }
      } catch (err) {
        console.warn("[signup] ref partner no asignado:", err)
      }
    }

    void ensureProyectoImplementacion({
      empresaId,
      planComercial: "Pro",
    }).catch((err) => console.error("Error auto-crear proyecto CCA en signup:", err))

    void syncPipelineFromEvent({
      nombre,
      email,
      negocio: nombreEmpresa,
      origen: "web_register",
      etapa: "trial",
      empresaId,
      notas: "Alta automática desde registro web trial 14d",
      proximaAccion: "Seguimiento trial — contactar en 48 h",
      notify: "trial_signup",
    }).catch((err) => console.error("Error sync pipeline signup:", err))

    // Track funnel de adquisición: complete_signup
    import("@/lib/analytics/tracking-service").then(({ trackFunnelStep }) => {
      void trackFunnelStep({
        sessionId: `signup-${empresaId}-${Date.now()}`,
        empresaId,
        usuarioId: usuario.id,
        funnelId: "adquisicion",
        stepName: "complete_signup",
      })
    }).catch(() => {})

    setSignupOrigen(empresaId, "web" as any)

    let onboarding: { landingPath: string; ofertaId?: string } | null = {
      landingPath: intentAlta?.landingPath ?? signupProfile.landingPath,
    }

    const activarKey = activar || signupProfile.activarKey
    if (activarKey && intentAlta) {
      try {
        const { applyActivarIntent } = await import("@/lib/comercial/activar-producto-service")
        const result = await applyActivarIntent({
          empresaId,
          activar: activarKey,
          origen: "web_register",
        })
        onboarding = { landingPath: result.landingPath || intentAlta.landingPath }

        const { trackSubSaasSignup } = await import("@/lib/analytics/tracking")
        trackSubSaasSignup(activarKey, empresaId)

        const { emailService } = await import("@/lib/email/email-service")
        const { emailSubSaasWelcome } = await import("@/lib/email/email-sub-saas-welcome")

        if (emailService.isConfigured()) {
          const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://claver.app"}/login?activar=${activarKey}`
          await emailService.enviar({
            to: email,
            subject: `Bienvenido a ${intentAlta.marca} - Empezá en 3 pasos`,
            html: emailSubSaasWelcome(intentAlta.marca, nombre, loginUrl),
          })
        }
      } catch (err) {
        console.error("Error en activación post-signup:", err)
      }
    }

    const authService = new AuthService()
    const token = await authService.generarToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      empresaId: usuario.empresaId,
    })

    return NextResponse.json({
      success: true,
      token,
      onboarding,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("Error en signup:", error)
    return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 })
  }
}
