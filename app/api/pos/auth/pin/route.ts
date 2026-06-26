import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { AuthService } from "@/lib/auth/auth-service"

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response

    const body = await request.json()
    const { pinCode } = body

    if (!pinCode) {
      return NextResponse.json({ error: "PIN requerido" }, { status: 400 })
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        empresaId: auth.auth.empresaId,
        pinCode: pinCode,
        activo: true,
      },
    })

    if (!usuario) {
      return NextResponse.json({ error: "PIN inválido" }, { status: 401 })
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
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        empresaId: usuario.empresaId,
      },
    })
  } catch (error) {
    console.error("Error en POS auth PIN:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
