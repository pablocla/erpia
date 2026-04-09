import { type NextRequest, NextResponse } from "next/server"
import { verificarToken } from "@/lib/auth/middleware"
import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "@/lib/afip/soap-client"
import { WSCDCClient, type ConstatacionInput } from "@/lib/afip/wscdc-client"
import { z } from "zod"

const constatarSchema = z.object({
  cuitEmisor: z.string().min(11).max(11),
  tipoCbte: z.number().int().positive(),
  puntoVenta: z.number().int().positive(),
  numeroCbte: z.number().int().positive(),
  fechaEmision: z.string().regex(/^\d{8}$/, "Formato YYYYMMDD"),
  importeTotal: z.number().positive(),
  codAutorizacion: z.string().min(14).max(14),
  tipoAutorizacion: z.enum(["E", "A"]).optional(),
  docTipoReceptor: z.number().int(),
  docNroReceptor: z.string(),
})

/**
 * POST /api/afip/wscdc — Constatar comprobante de proveedor
 *
 * Verifica que el CAE de una factura de proveedor sea válido.
 * Usado en el ciclo de compras para validación pre-registro.
 */
export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json()
    const validacion = constatarSchema.safeParse(body)
    if (!validacion.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: validacion.error.errors }, { status: 400 })
    }

    const input = validacion.data

    // Get empresa config
    const empresa = await prisma.empresa.findFirst({
      where: { id: (usuario as any).empresaId },
    })
    if (!empresa?.certificadoCRT || !empresa?.certificadoKEY) {
      return NextResponse.json({ error: "Certificados AFIP no configurados" }, { status: 400 })
    }

    const entorno = (process.env.AFIP_ENTORNO as "homologacion" | "produccion") ?? "homologacion"
    const soapClient = new AFIPSoapClient(entorno)
    const auth = await soapClient.authenticate(empresa.cuit, empresa.certificadoCRT, empresa.certificadoKEY)

    const wscdc = new WSCDCClient(entorno)
    const resultado = await wscdc.constatar(auth, empresa.cuit, input as ConstatacionInput)

    return NextResponse.json({
      success: resultado.resultado === "A",
      resultado: resultado.resultado,
      observaciones: resultado.observaciones,
      caeVerificado: resultado.caeVerificado,
      caeVencimiento: resultado.caeVencimiento,
    })
  } catch (error) {
    console.error("Error en WSCDC:", error)
    return NextResponse.json({ error: "Error al constatar comprobante" }, { status: 500 })
  }
}
