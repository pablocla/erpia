import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { AuthService } from "@/lib/auth/auth-service"
import { checkRateLimit } from "@/lib/auth/rate-limiter"
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/brand"
import { provisionIndustryDemo } from "@/lib/comercial/industry-demo-service"
import { getIndustryTemplate, DEMO_INDUSTRY_IDS } from "@/lib/comercial/industry-templates"

export const maxDuration = 60
export const dynamic = "force-dynamic"

/**
 * POST /api/auth/demo
 *
 * Demo segmentada por rubro — reutiliza empresa fija para testing interno.
 * Preferir /api/onboarding/industry-demo para demos de calle (empresa aislada).
 */
export async function POST(request: NextRequest) {
  try {
    // Production: demo deshabilitado salvo ALLOW_DEMO=1
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO !== "1") {
      const { recordPlatformEvent } = await import("@/lib/ops/platform-events")
      void recordPlatformEvent({
        severity: "sev3",
        source: "auth",
        code: "DEMO_BLOCKED",
        message: "Intento de /api/auth/demo bloqueado en production",
      })
      return NextResponse.json(
        { error: "Demo deshabilitado en producción", code: "DEMO_DISABLED" },
        { status: 403 },
      )
    }

    const blocked = checkRateLimit(request, "demo", 5, 15 * 60 * 1000)
    if (blocked) return blocked
    const ADMIN_EMAIL = DEMO_ADMIN_EMAIL
    const ADMIN_PASSWORD = DEMO_ADMIN_PASSWORD

    const body = await request.json().catch(() => ({}))
    const requestedIndustry =
      typeof body.industryId === "string"
        ? body.industryId
        : typeof body.rubro === "string"
          ? body.rubro
          : "veterinaria"

    const industryId = getIndustryTemplate(requestedIndustry)
      ? requestedIndustry
      : DEMO_INDUSTRY_IDS.includes(requestedIndustry)
        ? requestedIndustry
        : "veterinaria"

    let empresa = await prisma.empresa.findFirst({
      where: { cuit: "20-00000000-0" },
    })

    if (!empresa) {
      empresa = await prisma.empresa.create({
        data: {
          nombre: "Empresa Demo",
          razonSocial: "Empresa Demostración SRL",
          cuit: "20-00000000-0",
          direccion: "Av. Corrientes 1234, CABA",
          telefono: "011-4567-8900",
          email: ADMIN_EMAIL,
          puntoVenta: 1,
          entorno: "homologacion",
          rubro: "otro",
        },
      })
    }

    const provision = await provisionIndustryDemo(empresa.id, industryId)

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 8)

    let usuario = await prisma.usuario.findUnique({
      where: { email: ADMIN_EMAIL },
    })

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          nombre: "Administrador",
          email: ADMIN_EMAIL,
          password: hashedPassword,
          rol: "administrador",
          empresaId: empresa.id,
          activo: true,
        },
      })
    } else {
      usuario = await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          password: hashedPassword,
          activo: true,
          empresaId: empresa.id,
        },
      })
    }

    const authService = new AuthService()
    const token = await authService.generarToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      empresaId: usuario.empresaId,
    })

    const { recordPlatformEvent } = await import("@/lib/ops/platform-events")
    void recordPlatformEvent({
      severity: "sev4",
      source: "auth",
      code: "DEMO_LOGIN",
      message: `Demo login industry=${industryId}`,
      empresaId: empresa.id,
      meta: { industryId },
      skipDedupe: true,
    })

    return NextResponse.json({
      success: true,
      token,
      goldenPath: provision.goldenPath,
      industryId: provision.industryId,
      rubro: provision.rubro,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
      },
    })
  } catch (error) {
    console.error("Error en demo login:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al crear sesión demo",
      },
      { status: 500 },
    )
  }
}
