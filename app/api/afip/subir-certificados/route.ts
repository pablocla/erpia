import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const formData = await request.formData()
    const cuit = formData.get("cuit") as string
    const certificadoCRT = formData.get("certificadoCRT") as string
    const certificadoKEY = formData.get("certificadoKEY") as string

    if (!cuit || !certificadoCRT || !certificadoKEY) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // Buscar o crear la empresa
    let empresa = await prisma.empresa.findUnique({
      where: { cuit },
    })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada. Créela primero." }, { status: 404 })
    }

    // Codificar certificados en base64
    const crtBase64 = Buffer.from(certificadoCRT).toString("base64")
    const keyBase64 = Buffer.from(certificadoKEY).toString("base64")

    // Actualizar la empresa con los certificados
    empresa = await prisma.empresa.update({
      where: { cuit },
      data: {
        certificadoCRT: crtBase64,
        certificadoKEY: keyBase64,
      },
    })

    return NextResponse.json({
      success: true,
      mensaje: "Certificados guardados correctamente",
    })
  } catch (error) {
    console.error("Error al subir certificados:", error)
    return NextResponse.json({ error: "Error al guardar certificados" }, { status: 500 })
  }
}
