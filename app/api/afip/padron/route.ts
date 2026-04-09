import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "@/lib/afip/soap-client"
import { PadronA5Client } from "@/lib/afip/padron-a5-client"
import { z } from "zod"

const consultaSchema = z.object({
  cuit: z.string().min(11).max(11),
})

/**
 * POST /api/afip/padron — Consultar contribuyente en padrón ARCA
 *
 * Devuelve: denominación, condición IVA, domicilio, actividad, inscripciones.
 * Usado al crear cliente/proveedor para auto-completar datos fiscales.
 */
export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const validacion = consultaSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "CUIT inválido" }, { status: 400 })
    }

    const { cuit } = validacion.data

    const empresa = await prisma.empresa.findFirst({
      where: { id: (usuario as any).empresaId },
    })
    if (!empresa?.certificadoCRT || !empresa?.certificadoKEY) {
      return NextResponse.json({ error: "Certificados AFIP no configurados" }, { status: 400 })
    }

    const entorno = (process.env.AFIP_ENTORNO as "homologacion" | "produccion") ?? "homologacion"
    const soapClient = new AFIPSoapClient(entorno)
    const auth = await soapClient.authenticate(empresa.cuit, empresa.certificadoCRT, empresa.certificadoKEY)

    const padron = new PadronA5Client(entorno)
    const persona = await padron.getPersona(auth, empresa.cuit, cuit)

    if (!persona) {
      return NextResponse.json({ error: "CUIT no encontrado en padrón ARCA" }, { status: 404 })
    }

    return NextResponse.json(persona)
  } catch (error) {
    console.error("Error en PadronA5:", error)
    return NextResponse.json({ error: "Error al consultar padrón" }, { status: 500 })
  }
}
