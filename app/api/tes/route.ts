import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verificarToken } from "@/lib/auth/middleware"
import {
  ALL_TES_PREDEFINIDOS,
  getTESVentaPorCondicion,
  getTESCompraPorTipo,
  calcularImpuestosTES,
} from "@/lib/tes/tes-config"
import { calcularImpuestos, getRegisteredCountries } from "@/lib/tes/tax-engine"
import type { TaxInput } from "@/lib/tes/types"

export async function GET(request: NextRequest) {
  const usuario = await verificarToken(request)
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get("tipo")
  const activos = searchParams.get("activos") !== "false"
  const pais = searchParams.get("pais") // filter by country (null = all)

  let resultado = ALL_TES_PREDEFINIDOS
  if (tipo) resultado = resultado.filter((t) => t.tipo === tipo)
  if (activos) resultado = resultado.filter((t) => t.activo)
  // pais filter is not on TES type yet — reserved for future multi-country TES

  // Also expose registered countries for the country-selector UI
  const paises = getRegisteredCountries()

  return NextResponse.json({ tes: resultado, paises })
}

// ─── VALIDATION SCHEMA ────────────────────────────────────────────────────────

const TaxPartySchema = z.object({
  condicionIva: z.string(),
  esAgentePercepcionIVA: z.boolean().optional(),
  esAgentePercepcionIIBB: z.boolean().optional(),
  esAgenteRetencionSICORE: z.boolean().optional(),
  jurisdicciones: z.array(z.string()).optional(),
})

const TaxLineItemSchema = z.object({
  descripcion: z.string(),
  cantidad: z.number().positive(),
  precioUnitario: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
  codigoProducto: z.string().optional(),
  categoriaProducto: z.string().optional(),
  exento: z.boolean().optional(),
  reducido: z.boolean().optional(),
  superReducido: z.boolean().optional(),
})

// Full engine calculation — preferred path
const FullCalcSchema = z.object({
  pais: z.string().length(2),
  operacion: z.enum(["venta", "compra", "devolucion_venta", "devolucion_compra", "exportacion", "importacion"]),
  emisor: TaxPartySchema,
  receptor: TaxPartySchema,
  subtotalNeto: z.number().positive(),
  items: z.array(TaxLineItemSchema).optional(),
  jurisdiccionPrincipal: z.string().optional(),
  fechaOperacion: z.string().datetime().optional(),
  tesCodigo: z.string().optional(),
})

// Legacy TES lookup — backward compat
const LegacyCalcSchema = z.object({
  tesCodigo: z.string().optional(),
  subtotalNeto: z.union([z.number(), z.string()]),
  condicionIvaCliente: z.string().optional(),
  tipoFacturaProveedor: z.enum(["A", "B", "C"]).optional(),
})

export async function POST(request: NextRequest) {
  const usuario = await verificarToken(request)
  if (!usuario) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await request.json()

  // ── Full engine path (when pais + operacion + emisor + receptor are provided) ──
  const fullParse = FullCalcSchema.safeParse(body)
  if (fullParse.success) {
    const input: TaxInput = {
      ...fullParse.data,
      fechaOperacion: fullParse.data.fechaOperacion
        ? new Date(fullParse.data.fechaOperacion)
        : undefined,
    }
    try {
      const breakdown = calcularImpuestos(input)
      return NextResponse.json(breakdown)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error en cálculo de impuestos"
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  }

  // ── Legacy TES path (backward compat with existing callers) ─────────────────
  const legacyParse = LegacyCalcSchema.safeParse(body)
  if (!legacyParse.success) {
    return NextResponse.json(
      { error: "Payload inválido", detalle: legacyParse.error.flatten() },
      { status: 400 }
    )
  }

  const { tesCodigo, subtotalNeto, condicionIvaCliente, tipoFacturaProveedor } = legacyParse.data
  let tes = ALL_TES_PREDEFINIDOS.find((t) => t.codigo === tesCodigo)

  if (!tes && condicionIvaCliente) {
    tes = getTESVentaPorCondicion(condicionIvaCliente)
  }
  if (!tes && tipoFacturaProveedor) {
    tes = getTESCompraPorTipo(tipoFacturaProveedor)
  }
  if (!tes) {
    return NextResponse.json({ error: "TES no encontrado" }, { status: 404 })
  }

  const neto = parseFloat(String(subtotalNeto))
  const impuestos = calcularImpuestosTES(tes, neto)
  const totalImpuestos = impuestos.reduce((s, i) => s + i.monto, 0)

  return NextResponse.json({
    tes,
    impuestos,
    subtotalNeto: neto,
    totalImpuestos,
    total: neto + totalImpuestos,
  })
}

