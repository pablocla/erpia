import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { AuthService } from "@/lib/auth/auth-service"
import { checkRateLimit } from "@/lib/auth/rate-limiter"
import { z } from "zod"

const signupSchema = z.object({
  empresa: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
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

    const { empresa: nombreEmpresa, nombre, email, password } = validacion.data

    // Verificar que el email no esté en uso
    const usuarioExistente = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM usuarios WHERE email = ${email} LIMIT 1
    `
    if (usuarioExistente.length > 0) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
    }

    // Crear empresa usando SQL crudo (evita problemas con columnas nuevas no migradas)
    const empresaCreada = await prisma.$queryRaw<{ id: number }[]>`
      INSERT INTO empresas ("nombre", "razonSocial", "cuit", "email", "createdAt", "updatedAt")
      VALUES (
        ${nombreEmpresa},
        ${nombreEmpresa},
        ${`DEMO-${Date.now()}`},
        ${email},
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
    }, { status: 201 })
  } catch (error) {
    console.error("Error en signup:", error)
    return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 })
  }
}
