/**
 * GET  /api/afip/fce — consultar comprobantes FCE / monto obligado
 * POST /api/afip/fce — aceptar / rechazar / cancelar FCE (WSFEcred)
 */
import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "@/lib/afip/soap-client"
import { WSFEcredClient, mapFceEstadoAfip } from "@/lib/afip/wsfecred-client"
import { z } from "zod"

async function loadEmpresa(empresaId: number) {
  return prisma.empresa.findUnique({
    where: { id: empresaId },
    select: {
      cuit: true,
      certificadoCRT: true,
      certificadoKEY: true,
      entorno: true,
      entornoAfip: true,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const empresa = await loadEmpresa(ctx.auth.empresaId)
    if (!empresa?.certificadoCRT || !empresa.certificadoKEY) {
      return NextResponse.json(
        { error: "Certificados AFIP no configurados" },
        { status: 400 },
      )
    }

    const { searchParams } = new URL(request.url)
    const modo = searchParams.get("modo") ?? "comprobantes"
    const entorno =
      ((empresa.entornoAfip || empresa.entorno) as "homologacion" | "produccion") ??
      "homologacion"

    const soap = new AFIPSoapClient(entorno)
    const auth = await soap.authenticate(
      empresa.cuit,
      empresa.certificadoCRT,
      empresa.certificadoKEY,
      "wsfecred",
    )
    const fce = new WSFEcredClient(entorno)

    if (modo === "monto") {
      const r = await fce.consultarMontoObligado(
        auth,
        empresa.cuit,
        ctx.auth.empresaId,
      )
      return NextResponse.json({ ok: true, ...r })
    }

    const r = await fce.consultarComprobantes(
      auth,
      empresa.cuit,
      {
        fechaDesde: searchParams.get("fechaDesde") ?? undefined,
        fechaHasta: searchParams.get("fechaHasta") ?? undefined,
        estado: searchParams.get("estado") ?? undefined,
      },
      ctx.auth.empresaId,
    )

    return NextResponse.json({
      ok: true,
      items: r.items,
      estados: r.items.map((it) => ({
        raw: it,
        estado: mapFceEstadoAfip(
          (it as { estado?: string; codigoEstado?: string })?.estado ??
            (it as { codigoEstado?: string })?.codigoEstado,
        ),
      })),
    })
  } catch (error) {
    console.error("GET FCE:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al consultar FCE (WSFEcred)",
      },
      { status: 500 },
    )
  }
}

const postSchema = z.object({
  accion: z.enum(["aceptar", "rechazar", "cancelar"]),
  cuitEmisor: z.string().min(11).max(13),
  tipoCbte: z.number().int(),
  puntoVenta: z.number().int(),
  numero: z.number().int(),
  motivo: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalles: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const empresa = await loadEmpresa(ctx.auth.empresaId)
    if (!empresa?.certificadoCRT || !empresa.certificadoKEY) {
      return NextResponse.json(
        { error: "Certificados AFIP no configurados" },
        { status: 400 },
      )
    }

    const entorno =
      ((empresa.entornoAfip || empresa.entorno) as "homologacion" | "produccion") ??
      "homologacion"
    const soap = new AFIPSoapClient(entorno)
    const auth = await soap.authenticate(
      empresa.cuit,
      empresa.certificadoCRT,
      empresa.certificadoKEY,
      "wsfecred",
    )
    const fce = new WSFEcredClient(entorno)
    const ref = {
      cuitEmisor: parsed.data.cuitEmisor,
      tipoCbte: parsed.data.tipoCbte,
      puntoVenta: parsed.data.puntoVenta,
      numero: parsed.data.numero,
    }

    if (parsed.data.accion === "cancelar") {
      const r = await fce.informarCancelacion(
        auth,
        empresa.cuit,
        ref,
        ctx.auth.empresaId,
      )
      return NextResponse.json(r, { status: r.ok ? 200 : 422 })
    }

    const r = await fce.aceptarRechazar(
      auth,
      empresa.cuit,
      ref,
      parsed.data.accion === "aceptar" ? "A" : "R",
      parsed.data.motivo,
      ctx.auth.empresaId,
    )
    return NextResponse.json(r, { status: r.ok ? 200 : 422 })
  } catch (error) {
    console.error("POST FCE:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error FCE" },
      { status: 500 },
    )
  }
}
