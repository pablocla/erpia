import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { AuthService } from "@/lib/auth/auth-service"
import { checkRateLimit } from "@/lib/auth/rate-limiter"

/**
 * POST /api/auth/demo
 *
 * Creates (or finds) a demo empresa with admin + demo users and returns a real JWT.
 */
export async function POST(request: NextRequest) {
  try {
    const blocked = checkRateLimit(request, "demo", 10, 15 * 60 * 1000)
    if (blocked) return blocked
    const ADMIN_EMAIL = "admin@erp-argentina.com"
    const ADMIN_PASSWORD = "admin1234"

    const body = await request.json().catch(() => ({}))
    const requestedRubro = typeof body.rubro === "string" ? body.rubro : "salon_belleza"
    const allowedRubros = ["salon_belleza", "bar_restaurant", "farmacia", "veterinaria"]
    const demoRubro = allowedRubros.includes(requestedRubro) ? requestedRubro : "salon_belleza"

    // 1. Ensure demo empresa exists
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
          rubro: demoRubro,
        },
      })
    } else if (empresa.rubro !== demoRubro) {
      empresa = await prisma.empresa.update({
        where: { id: empresa.id },
        data: { rubro: demoRubro },
      })
    }

    // 2. Ensure admin user exists
    let usuario = await prisma.usuario.findUnique({
      where: { email: ADMIN_EMAIL },
    })

    if (!usuario) {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)
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
    }

    // 3. Generate real JWT
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
      { error: "Error al crear sesión demo" },
      { status: 500 },
    )
  }
}
