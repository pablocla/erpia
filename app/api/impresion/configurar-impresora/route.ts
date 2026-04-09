import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarToken, verificarRol } from "@/lib/auth/middleware"

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    if (!verificarRol(usuario, ["administrador"])) {
      return NextResponse.json({ error: "Solo administradores pueden configurar impresoras" }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, tipo, marca, modelo, conexion, ip, puerto } = body

    // Desactivar todas las impresoras
    await prisma.configuracionImpresora.updateMany({
      data: { activa: false },
    })

    // Crear o actualizar la impresora
    const impresora = await prisma.configuracionImpresora.create({
      data: {
        nombre,
        tipo,
        marca,
        modelo,
        conexion,
        ip,
        puerto,
        activa: true,
      },
    })

    return NextResponse.json({
      success: true,
      impresora,
    })
  } catch (error) {
    console.error("Error al configurar impresora:", error)
    return NextResponse.json({ error: "Error al configurar impresora" }, { status: 500 })
  }
}
