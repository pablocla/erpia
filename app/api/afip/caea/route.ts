/**
 * GET  /api/afip/caea          — Consultar CAEA vigente en DB (sin llamar a AFIP)
 * POST /api/afip/caea          — Solicitar nuevo CAEA a AFIP y persistir en DB
 * PUT  /api/afip/caea          — Informar comprobantes emitidos offline con CAEA
 *
 * Flujo CAEA (RG 5782/2025 — contingencia offline):
 *  1. Al inicio de cada quincena: POST para solicitar CAEA → se guarda en Factura.caea
 *  2. Si AFIP cae: el POS usa el CAEA del campo Empresa.caeaVigente para emitir offline
 *  3. Al recuperar conectividad: PUT informarComprobantes para registrar en AFIP
 */
import { type NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { prisma } from "@/lib/prisma"
import { AFIPSoapClient } from "@/lib/afip/soap-client"
import { CAEAService } from "@/lib/afip/caea-service"
import { z } from "zod"

// ─── GET — consultar CAEA vigente almacenado en DB ───────────────────────────

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const empresa = await prisma.empresa.findUnique({
      where: { id: ctx.auth.empresaId },
      select: {
        cuit: true,
        caeaVigente: true,
        caeaVigDesde: true,
        caeaVigHasta: true,
        caeaTopeInformar: true,
        caeaQuincena: true,
        caeaPeriodo: true,
      },
    })

    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

    const ahora = new Date()
    const vigente = empresa.caeaVigente && empresa.caeaVigHasta
      ? ahora <= new Date(empresa.caeaVigHasta)
      : false

    return NextResponse.json({
      caeaVigente: empresa.caeaVigente,
      vigente,
      periodo: empresa.caeaPeriodo,
      quincena: empresa.caeaQuincena,
      vigDesde: empresa.caeaVigDesde,
      vigHasta: empresa.caeaVigHasta,
      topeInformar: empresa.caeaTopeInformar,
      diasParaVencer: empresa.caeaVigHasta
        ? Math.ceil((new Date(empresa.caeaVigHasta).getTime() - ahora.getTime()) / 86400000)
        : null,
    })
  } catch (error) {
    console.error("Error al consultar CAEA:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── POST — solicitar nuevo CAEA a AFIP ──────────────────────────────────────

const solicitarSchema = z.object({
  puntoVenta: z.number().int().min(1).max(9999),
})

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = solicitarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: ctx.auth.empresaId },
      select: { cuit: true, certificadoCRT: true, certificadoKEY: true, entornoAfip: true },
    })

    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    if (!empresa.certificadoCRT || !empresa.certificadoKEY) {
      return NextResponse.json({ error: "Certificados AFIP no configurados. Configure los certificados antes de solicitar CAEA." }, { status: 400 })
    }

    const entorno = (empresa.entornoAfip as "homologacion" | "produccion") ?? "homologacion"
    const soapClient = new AFIPSoapClient(entorno)
    const caeaService = new CAEAService(entorno)

    // Autenticar con AFIP
    const auth = await soapClient.authenticate(empresa.cuit, empresa.certificadoCRT, empresa.certificadoKEY)

    // Solicitar CAEA
    const caeaData = await caeaService.solicitarCAEA(auth, empresa.cuit, parsed.data.puntoVenta)

    // Persistir en Empresa
    await prisma.empresa.update({
      where: { id: ctx.auth.empresaId },
      data: {
        caeaVigente: caeaData.caea,
        caeaPeriodo: caeaData.periodo,
        caeaQuincena: caeaData.quincena,
        caeaVigDesde: new Date(
          parseInt(caeaData.fechaDesde.slice(0, 4)),
          parseInt(caeaData.fechaDesde.slice(4, 6)) - 1,
          parseInt(caeaData.fechaDesde.slice(6, 8)),
        ),
        caeaVigHasta: new Date(
          parseInt(caeaData.fechaHasta.slice(0, 4)),
          parseInt(caeaData.fechaHasta.slice(4, 6)) - 1,
          parseInt(caeaData.fechaHasta.slice(6, 8)),
        ),
        caeaTopeInformar: new Date(
          parseInt(caeaData.fechaTopeInformar.slice(0, 4)),
          parseInt(caeaData.fechaTopeInformar.slice(4, 6)) - 1,
          parseInt(caeaData.fechaTopeInformar.slice(6, 8)),
        ),
      },
    })

    return NextResponse.json({
      ok: true,
      caea: caeaData.caea,
      periodo: caeaData.periodo,
      quincena: caeaData.quincena,
      vigDesde: caeaData.fechaDesde,
      vigHasta: caeaData.fechaHasta,
      topeInformar: caeaData.fechaTopeInformar,
      mensaje: `CAEA otorgado. Válido del ${caeaData.fechaDesde} al ${caeaData.fechaHasta}.`,
    })
  } catch (error: any) {
    console.error("Error al solicitar CAEA:", error)
    return NextResponse.json({ error: error?.message ?? "Error al solicitar CAEA a AFIP" }, { status: 500 })
  }
}

// ─── PUT — informar comprobantes offline emitidos con CAEA ───────────────────

const informarSchema = z.object({
  puntoVenta: z.number().int().min(1).max(9999),
  caea: z.string().min(10),
})

export async function PUT(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response

    const body = await request.json()
    const parsed = informarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: ctx.auth.empresaId },
      select: { cuit: true, certificadoCRT: true, certificadoKEY: true, entornoAfip: true },
    })

    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
    if (!empresa.certificadoCRT || !empresa.certificadoKEY) {
      return NextResponse.json({ error: "Certificados AFIP no configurados" }, { status: 400 })
    }

    // Buscar facturas emitidas offline con este CAEA que aún no fueron informadas
    const facturasOffline = await prisma.factura.findMany({
      where: {
        empresaId: ctx.auth.empresaId,
        modalidadAuth: "CAEA",
        caea: parsed.data.caea,
        estado: "emitida",
        puntoVenta: parsed.data.puntoVenta,
      },
      include: { cliente: true },
      orderBy: [{ tipoCbte: "asc" }, { numero: "asc" }],
    })

    if (facturasOffline.length === 0) {
      return NextResponse.json({ ok: true, mensaje: "No hay comprobantes offline pendientes de informar", informados: 0 })
    }

    const entorno = (empresa.entornoAfip as "homologacion" | "produccion") ?? "homologacion"
    const soapClient = new AFIPSoapClient(entorno)
    const caeaService = new CAEAService(entorno)

    const auth = await soapClient.authenticate(empresa.cuit, empresa.certificadoCRT, empresa.certificadoKEY)

    // Agrupar por tipoCbte para el informe
    const grupos = new Map<number, typeof facturasOffline>()
    for (const f of facturasOffline) {
      if (!grupos.has(f.tipoCbte)) grupos.set(f.tipoCbte, [])
      grupos.get(f.tipoCbte)!.push(f)
    }

    const erroresTotal: string[] = []

    for (const [, facturas] of grupos) {
      const comprobantes = facturas.map((f) => ({
        tipoCbte: f.tipoCbte,
        cbteDesde: f.numero,
        cbteHasta: f.numero,
        fecha: f.createdAt.toISOString().slice(0, 10).replace(/-/g, ""),
        docTipo: f.cliente?.cuit ? 80 : 99,
        docNro: f.cliente?.cuit ?? "0",
        impTotal: Number(f.total),
        impNeto: Number(f.subtotal),
        impIVA: Number(f.iva),
        impTrib: Number(f.totalPercepciones ?? 0),
      }))

      const resultado = await caeaService.informarComprobantesCAEA(
        auth,
        empresa.cuit,
        parsed.data.puntoVenta,
        parsed.data.caea,
        comprobantes,
      )

      erroresTotal.push(...resultado.errores)
    }

    return NextResponse.json({
      ok: erroresTotal.length === 0,
      informados: facturasOffline.length,
      errores: erroresTotal,
      mensaje: erroresTotal.length === 0
        ? `${facturasOffline.length} comprobante(s) informados correctamente a AFIP.`
        : `${facturasOffline.length - erroresTotal.length} informados, ${erroresTotal.length} con error.`,
    })
  } catch (error: any) {
    console.error("Error al informar CAEA:", error)
    return NextResponse.json({ error: error?.message ?? "Error al informar comprobantes CAEA" }, { status: 500 })
  }
}
