/**
 * GET /api/afip/tipos-comprobante
 *
 * Devuelve la tabla oficial de tipos de comprobante AFIP.
 * Parámetros opcionales:
 *   ?activo=true          — sólo tipos activos (default true)
 *   ?emitidoPor=responsable_inscripto | monotributista | exportacion | todos
 */
import { type NextRequest, NextResponse } from "next/server"
import { TIPOS_COMPROBANTE_AFIP, ALICUOTAS_IVA_AFIP, CODIGOS_TRIBUTOS_AFIP, CODIGOS_SICORE, getTiposComprobanteActivos } from "@/lib/afip/tipos-comprobante"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const soloActivos = searchParams.get("activo") !== "false"
  const emitidoPor  = searchParams.get("emitidoPor") ?? undefined
  const tabla       = searchParams.get("tabla") ?? "comprobantes"

  if (tabla === "alicuotas_iva") {
    return NextResponse.json(ALICUOTAS_IVA_AFIP)
  }
  if (tabla === "tributos") {
    return NextResponse.json(CODIGOS_TRIBUTOS_AFIP)
  }
  if (tabla === "sicore") {
    return NextResponse.json(CODIGOS_SICORE)
  }

  const tipos = soloActivos
    ? getTiposComprobanteActivos(emitidoPor)
    : TIPOS_COMPROBANTE_AFIP.filter((t) => !emitidoPor || t.emitidoPor === emitidoPor || t.emitidoPor === "todos")

  return NextResponse.json({
    tipos,
    total: tipos.length,
    tablas_disponibles: ["comprobantes", "alicuotas_iva", "tributos", "sicore"],
  })
}
