import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { AuthService } from "@/lib/auth/auth-service"
import { checkRateLimit } from "@/lib/auth/rate-limiter"
import { DEMO_ADMIN_PASSWORD } from "@/lib/brand"
import { provisionIndustryDemo, resolveIndustryId } from "@/lib/comercial/industry-demo-service"
import { syncPipelineFromEvent } from "@/lib/comercial/comercial-funnel-service"
import { setSignupOrigen } from "@/lib/ops/signup-tracking"

/** Vercel / serverless: el provision puede tardar; sin esto se corta a 10s y el browser se tilda. */
export const maxDuration = 60
export const dynamic = "force-dynamic"

/**
 * POST /api/onboarding/industry-demo
 * Sensor comercial público — provisiona demo segmentada por industria y devuelve JWT.
 */
export async function POST(request: NextRequest) {
  let empresaIdCreada: number | null = null

  try {
    const body = await request.json().catch(() => ({}))
    const demoSecret = typeof body.demo_secret === "string" ? body.demo_secret.trim() : ""
    
    // Bypass rate limit para automatización QA / Deep links comerciales confiables
    const isQA = demoSecret === (process.env.QA_DEMO_SECRET || "bypass_demo_rate_limit_123")
    
    if (!isQA) {
      const blocked = checkRateLimit(request, "industry-demo", 15, 15 * 60 * 1000)
      if (blocked) return blocked
    }
    const industryId = typeof body.industryId === "string" ? body.industryId.trim() : ""
    const activar = typeof body.activar === "string" ? body.activar.trim() : ""
    if (!industryId) {
      return NextResponse.json({ error: "industryId requerido" }, { status: 400 })
    }

    if (!resolveIndustryId(industryId)) {
      return NextResponse.json({ error: `Industria no soportada: ${industryId}` }, { status: 400 })
    }

    const t0 = Date.now()
    const demoHash = crypto.randomUUID().split("-")[0]
    const fakeCuit = `20-${demoHash}-0`
    const demoEmail = `demo-${demoHash}@claver.com.ar`

    const empresa = await prisma.empresa.create({
      data: {
        nombre: `Empresa Demo ${demoHash}`,
        razonSocial: `Empresa Demostración SRL (${demoHash})`,
        cuit: fakeCuit,
        direccion: "Av. Corrientes 1234, CABA",
        telefono: "011-4567-8900",
        email: demoEmail,
        puntoVenta: 1,
        entorno: "homologacion",
        rubro: "otro",
      },
    })
    empresaIdCreada = empresa.id

    const provision = await provisionIndustryDemo(empresa.id, industryId)

    if (activar) {
      const { persistDemoActivarIntent } = await import("@/lib/comercial/ofertas-comerciales")
      await persistDemoActivarIntent(empresa.id, activar)
    }

    await setSignupOrigen(
      empresa.id,
      "industry_demo",
      `${industryId}@${new Date().toISOString()}`,
    )

    // 8 rounds es suficiente para demos efímeras (10 bloquea CPU en serverless)
    const hashedPassword = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 8)

    const usuario = await prisma.usuario.create({
      data: {
        nombre: "Administrador Demo",
        email: demoEmail,
        password: hashedPassword,
        rol: "administrador",
        empresaId: empresa.id,
        activo: true,
      },
    })

    void syncPipelineFromEvent({
      nombre: `Visitante demo ${industryId}`,
      email: demoEmail,
      negocio: empresa.nombre,
      rubro: provision.rubro,
      origen: "industry_demo",
      etapa: "trial",
      empresaId: empresa.id,
      notas: `Demo rubro: ${industryId} · hash ${demoHash}`,
      proximaAccion: "Ver si convierte a trial propio — ofrecer registro",
      creadoPor: "demo@claver.com.ar",
      notify: "demo_rubro",
    }).catch((err) => console.error("Error sync pipeline demo:", err))

    const authService = new AuthService()
    const token = await authService.generarToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      empresaId: usuario.empresaId,
    })

    console.log(
      `[industry-demo] OK empresa=${empresa.id} industry=${industryId} en ${Date.now() - t0}ms`,
    )

    return NextResponse.json({
      success: true,
      token,
      goldenPath: provision.goldenPath,
      industryId: provision.industryId,
      rubro: provision.rubro,
      provision,
      activar: activar || null,
      durationMs: Date.now() - t0,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
      },
    })
  } catch (error) {
    console.error("Error industry-demo:", error)

    // Evitar empresas huérfanas sin usuario si falló el provision
    if (empresaIdCreada != null) {
      try {
        await prisma.usuario.deleteMany({ where: { empresaId: empresaIdCreada } }).catch(() => {})
        // No borrar en cascada todo el grafo (puede fallar por FKs); marcar como demo fallida
        await prisma.empresa.update({
          where: { id: empresaIdCreada },
          data: {
            nombre: `[DEMO FALLIDA] ${empresaIdCreada}`,
            email: `failed-demo-${empresaIdCreada}@claver.com.ar`,
          },
        }).catch(() => {})
      } catch {
        /* ignore cleanup */
      }
    }

    const message = error instanceof Error ? error.message : "Error al provisionar demo"
    return NextResponse.json(
      {
        error:
          message.includes("Unique constraint") || message.includes("unique")
            ? "No se pudo armar la demo por un conflicto de datos. Reintentá en unos segundos."
            : message,
      },
      { status: 500 },
    )
  }
}
