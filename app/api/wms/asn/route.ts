import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/auth/empresa-guard"
import { logError } from "@/lib/monitoring/error-logger"
import * as asnService from "@/lib/wms/asn-service"
import { z } from "zod"

const schema = z.object({
  action: z.enum(["crear", "recibir", "cerrar"]).default("crear"),
  depositoId: z.number().int().positive().optional(),
  asnId: z.number().int().positive().optional(),
  ordenCompraId: z.number().int().positive().optional().nullable(),
  proveedorId: z.number().int().positive().optional().nullable(),
  eta: z.string().optional().nullable(),
  recepcionCiega: z.boolean().optional(),
  notas: z.string().optional(),
  autoPutaway: z.boolean().optional(),
  lineas: z
    .array(
      z.object({
        productoId: z.number().int().positive().optional().nullable(),
        descripcion: z.string().optional(),
        cantidadEsperada: z.number().positive().optional(),
        lineaAsnId: z.number().int().positive().optional(),
        cantidadRecibida: z.number().optional(),
        loteId: z.number().int().positive().optional().nullable(),
      }),
    )
    .optional(),
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const estado = request.nextUrl.searchParams.get("estado") ?? undefined
    const ciega = request.nextUrl.searchParams.get("rf") === "1"
    let data = await asnService.listarAsn(ctx.auth.empresaId, estado)
    if (ciega) {
      data = data.map((a) => asnService.vistaRecepcionRf(a) as typeof a)
    }
    return NextResponse.json(data)
  } catch (error) {
    logError("api/wms/asn:GET", error, request)
    return NextResponse.json({ error: "Error al listar ASN" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request)
    if (!ctx.ok) return ctx.response
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }
    const d = parsed.data

    if (d.action === "crear") {
      if (!d.depositoId || !d.lineas?.length) {
        return NextResponse.json({ error: "depositoId y lineas requeridos" }, { status: 400 })
      }
      const asn = await asnService.crearAsn({
        empresaId: ctx.auth.empresaId,
        depositoId: d.depositoId,
        ordenCompraId: d.ordenCompraId,
        proveedorId: d.proveedorId,
        eta: d.eta,
        recepcionCiega: d.recepcionCiega,
        notas: d.notas,
        lineas: d.lineas.map((l) => ({
          productoId: l.productoId,
          descripcion: l.descripcion ?? "Ítem",
          cantidadEsperada: l.cantidadEsperada ?? 0,
          loteId: l.loteId,
        })),
      })
      return NextResponse.json(asn, { status: 201 })
    }

    if (!d.asnId) return NextResponse.json({ error: "asnId requerido" }, { status: 400 })

    if (d.action === "cerrar") {
      const asn = await asnService.cerrarAsn(ctx.auth.empresaId, d.asnId)
      return NextResponse.json(asn)
    }

    const recibidas = (d.lineas ?? [])
      .filter((l) => l.lineaAsnId && l.cantidadRecibida != null)
      .map((l) => ({
        lineaAsnId: l.lineaAsnId!,
        cantidadRecibida: l.cantidadRecibida!,
        loteId: l.loteId,
      }))

    if (!recibidas.length) {
      return NextResponse.json({ error: "lineas de recepción requeridas" }, { status: 400 })
    }

    const asn = await asnService.recibirAsn({
      empresaId: ctx.auth.empresaId,
      asnId: d.asnId,
      lineas: recibidas,
      autoPutaway: d.autoPutaway,
    })
    return NextResponse.json(asn)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error"
    if (["ASN_NO_ENCONTRADO", "ASN_SIN_LINEAS", "SIN_UBICACION_PUTAWAY"].includes(msg)) {
      return NextResponse.json({ error: msg }, { status: 400 })
    }
    logError("api/wms/asn:POST", error, request)
    return NextResponse.json({ error: "Error en ASN" }, { status: 500 })
  }
}
