import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { verificarRol } from "@/lib/auth/middleware"

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth.ok) return auth.response
    if (!verificarRol(auth.auth, ["administrador"])) {
      return NextResponse.json({ error: "Solo administradores pueden configurar impresoras" }, { status: 403 })
    }

    const body = await request.json()
    const { nombre, tipo, marca, modelo, conexion, ip, puerto } = body
    const empresaId = auth.auth.empresaId

    await prisma.configuracionImpresora.updateMany({
      where: { empresaId },
      data: { activa: false },
    })

    const impresora = await prisma.configuracionImpresora.upsert({
      where: { empresaId_nombre: { empresaId, nombre } },
      update: { tipo, marca, modelo, conexion, ip, puerto, activa: true },
      create: {
        empresaId,
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
