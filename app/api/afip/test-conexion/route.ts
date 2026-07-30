import { type NextRequest, NextResponse } from "next/server"
import { AFIPSoapClient } from "@/lib/afip/soap-client"
import { prisma } from "@/lib/prisma"
import { verificarToken } from "@/lib/auth/middleware"
import { readCertMeta } from "@/lib/afip/cert-utils"
import { getTaCacheStats } from "@/lib/afip/wsaa-service"

/**
 * POST /api/afip/test-conexion
 * Body opcional: { cuit?, services?: ("wsfe"|"wsfex"|"wscdc"|"ws_sr_padron_a5"|"wsfecred")[] }
 */
export async function POST(request: NextRequest) {
  try {
    const usuario = await verificarToken(request)
    if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const cuitBody = (body as { cuit?: string }).cuit
    const services = ((body as { services?: string[] }).services ?? [
      "wsfe",
    ]) as Array<"wsfe" | "wsfex" | "wscdc" | "ws_sr_padron_a5" | "wsfecred">

    const empresa = cuitBody
      ? await prisma.empresa.findUnique({ where: { cuit: cuitBody } })
      : await prisma.empresa.findFirst({
          where: { id: (usuario as { empresaId?: number }).empresaId },
        })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    }

    if (!empresa.certificadoCRT || !empresa.certificadoKEY) {
      return NextResponse.json(
        { error: "Certificados AFIP no configurados" },
        { status: 400 },
      )
    }

    const entorno = (empresa.entornoAfip ||
      empresa.entorno) as "homologacion" | "produccion"
    const soapClient = new AFIPSoapClient(entorno)

    const resultados: Record<
      string,
      { ok: boolean; expiracion?: string; error?: string }
    > = {}

    for (const service of services) {
      try {
        const auth = await soapClient.authenticate(
          empresa.cuit,
          empresa.certificadoCRT,
          empresa.certificadoKEY,
          service,
        )
        resultados[service] = {
          ok: true,
          expiracion: auth.expirationTime.toISOString(),
        }
      } catch (e) {
        resultados[service] = {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        }
      }
    }

    let certMeta: ReturnType<typeof readCertMeta> | null = null
    try {
      certMeta = readCertMeta(empresa.certificadoCRT)
    } catch {
      certMeta = null
    }

    let dummy: unknown = null
    if (resultados.wsfe?.ok) {
      try {
        dummy = await soapClient.dummy()
      } catch {
        dummy = null
      }
    }

    const allOk = Object.values(resultados).every((r) => r.ok)

    return NextResponse.json({
      success: allOk,
      mensaje: allOk
        ? "Conexión exitosa con AFIP"
        : "Algunos servicios fallaron la autenticación",
      entorno,
      servicios: resultados,
      dummy,
      certificado: certMeta
        ? {
            estado: certMeta.estado,
            daysToExpiry: certMeta.daysToExpiry,
            notAfter: certMeta.notAfter.toISOString(),
            subjectCn: certMeta.subjectCn,
          }
        : null,
      taCache: getTaCacheStats(),
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
