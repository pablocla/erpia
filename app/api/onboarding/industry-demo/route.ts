import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { AuthService } from "@/lib/auth/auth-service"
import { checkRateLimit } from "@/lib/auth/rate-limiter"
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "@/lib/brand"
import { provisionIndustryDemo } from "@/lib/comercial/industry-demo-service"

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
    if (!industryId) {
      return NextResponse.json({ error: "industryId requerido" }, { status: 400 })
    }

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
          email: DEMO_ADMIN_EMAIL,
          puntoVenta: 1,
          entorno: "homologacion",
          rubro: "otro",
        },
      })
    }

    const provision = await provisionIndustryDemo(empresa.id, industryId)

    const hashedPassword = await bcrypt.hash(DEMO_ADMIN_PASSWORD, 10)

    let usuario = await prisma.usuario.findUnique({
      where: { email: DEMO_ADMIN_EMAIL },
    })

    if (!usuario) {
      usuario = await prisma.usuario.create({
        data: {
          nombre: "Administrador Demo",
          email: DEMO_ADMIN_EMAIL,
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

    return NextResponse.json({
      success: true,
      token,
      goldenPath: provision.goldenPath,
      industryId: provision.industryId,
      rubro: provision.rubro,
      provision,
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