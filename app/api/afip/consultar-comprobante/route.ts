/**
 * POST /api/afip/consultar-comprobante
 * FECompConsultar — reconsulta un comprobante autorizado en AFIP.
 */
import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "@/lib/afip/soap-client"
import { z } from "zod"

const schema = z.object({
  tipoCbte: z.number().int().positive(),
  puntoVenta: z.number().int().positive(),
  numero: z.number().int().positive(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: ctx.auth.empresaId },
      select: {
        cuit: true,
        certificadoCRT: true,
        certificadoKEY: true,
        entorno: true,
        entornoAfip: true,
      },
    })
    if (!empresa?.certificadoCRT || !empresa.certificadoKEY) {
      return NextResponse.json(
        { error: "Certificados AFIP no configurados" },
        { status: 400 },
      )
    }

    const entorno =
      ((empresa.entornoAfip || empresa.entorno) as "homologacion" | "produccion") ??
      "homologacion"
    const client = new AFIPSoapClient(entorno)
    const auth = await client.authenticate(
      empresa.cuit,
      empresa.certificadoCRT,
      empresa.certificadoKEY,
      "wsfe",
    )
    const result = await client.consultarComprobante(
      auth,
      empresa.cuit,
      parsed.data,
      ctx.auth.empresaId,
    )

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    console.error("FECompConsultar:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error al consultar comprobante",
      },
      { status: 500 },
    )
  }
}
