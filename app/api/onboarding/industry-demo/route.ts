import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { AuthService } from "@/lib/auth/auth-service"
import { checkRateLimit } from "@/lib/auth/rate-limiter"
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/brand"
import { provisionIndustryDemo } from "@/lib/comercial/industry-demo-service"
import { syncPipelineFromEvent } from "@/lib/comercial/comercial-funnel-service"
import { setSignupOrigen } from "@/lib/ops/signup-tracking"

/**
 * POST /api/onboarding/industry-demo
 * Sensor comercial público — provisiona demo segmentada por industria y devuelve JWT.
 */
export async function POST(request: NextRequest) {
  try {
    const blocked = checkRateLimit(request, "industry-demo", 15, 15 * 60 * 1000)
    if (blocked) return blocked

    const body = await request.json().catch(() => ({}))
    const industryId = typeof body.industryId === "string" ? body.industryId.trim() : ""
    const activar = typeof body.activar === "string" ? body.activar.trim() : ""
    if (!industryId) {
      return NextResponse.json({ error: "industryId requerido" }, { status: 400 })
    }

    const demoHash = crypto.randomUUID().split("-")[0] // 8 characters
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

    const hashedPassword = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10)

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

    return NextResponse.json({
      success: true,
      token,
      goldenPath: provision.goldenPath,
      industryId: provision.industryId,
      rubro: provision.rubro,
      provision,
      activar: activar || null,
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al provisionar demo" },
      { status: 500 },
    )
  }
}