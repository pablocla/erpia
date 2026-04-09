import { type NextRequest, NextResponse } from "next/server"
import { AFIPSoapClient } from "@/lib/afip/soap-client"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"

export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const { cuit } = await request.json()

    if (!cuit) {
      return NextResponse.json({ error: "CUIT es requerido" }, { status: 400 })
    }

    // Buscar la empresa
    const empresa = await prisma.empresa.findUnique({
      where: { cuit },
    })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    if (!empresa.certificadoCRT || !empresa.certificadoKEY) {
      return NextResponse.json({ error: "Certificados AFIP no configurados" }, { status: 400 })
    }

    // Intentar autenticar
    const entorno = empresa.entorno as "homologacion" | "produccion"
    const soapClient = new AFIPSoapClient(entorno)

    const auth = await soapClient.authenticate(empresa.cuit, empresa.certificadoCRT, empresa.certificadoKEY)

    return NextResponse.json({
      success: true,
      mensaje: "Conexión exitosa con AFIP",
      entorno,
      expiracion: auth.expirationTime,
    })
  } catch (error) {
    console.error("Error al probar conexión AFIP:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
