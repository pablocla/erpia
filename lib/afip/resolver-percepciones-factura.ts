/**
 * Calcula percepciones IIBB/IVA para facturas creadas sin motor TES (ej. POS).
 * Reutiliza getFiscalEmissionContext + calcularImpuestos como factura-service.
 */
import { calcularImpuestos } from "@/lib/tes/tax-engine"
import type { TaxBreakdown } from "@/lib/tes/types"
import { getFiscalEmissionContext } from "./fiscal-context"

export interface AfipTributo {
  Id: number
  Desc: string
  BaseImp: number
  Alic: number
  Importe: number
}

export function tributosFromBreakdown(breakdown: TaxBreakdown): AfipTributo[] {
  const tributos: AfipTributo[] = []

  for (const perc of breakdown.percepciones ?? []) {
    tributos.push({
      Id: perc.jurisdiccion === "federal" ? 1 : 2,
      Desc: perc.nombre ?? `Percepción ${perc.tipo}`,
      BaseImp: perc.base,
      Alic: perc.alicuota,
      Importe: perc.monto,
    })
  }

  for (const iibb of breakdown.iibb ?? []) {
    if (iibb.monto > 0) {
      tributos.push({
        Id: 2,
        Desc: `Percepción IIBB ${iibb.jurisdiccion ?? ""}`,
        BaseImp: iibb.base,
        Alic: iibb.alicuota,
        Importe: iibb.monto,
      })
    }
  }

  return tributos
}

interface LineaFacturaInput {
  descripcion: string
  cantidad: number
  precioUnitario: number
  subtotal: number
  porcentajeIva: number
}

interface TributoDb {
  codigoAfip: number
  descripcion: string
  baseImponible: number
  alicuota: number
  importe: number
}

export async function resolverPercepcionesFactura(input: {
  empresaId: number
  subtotal: number
  totalPercepciones: number
  lineas: LineaFacturaInput[]
  cliente: { condicionIva?: string | null } | null
  tributos?: TributoDb[]
}): Promise<{ totalPercepciones: number; tributos: AfipTributo[] }> {
  if (input.totalPercepciones > 0 && input.tributos && input.tributos.length > 0) {
    const tributos = input.tributos.map((t) => ({
      Id: t.codigoAfip,
      Desc: t.descripcion,
      BaseImp: Number(t.baseImponible),
      Alic: t.alicuota,
      Importe: Number(t.importe),
    }))
    return { totalPercepciones: input.totalPercepciones, tributos }
  }

  if (input.totalPercepciones > 0) {
    return { totalPercepciones: input.totalPercepciones, tributos: [] }
  }

  const fiscal = await getFiscalEmissionContext(input.empresaId)

  try {
    const breakdown = calcularImpuestos({
      pais: "AR",
      operacion: "venta",
      emisor: {
        condicionIva: "Responsable Inscripto",
        esAgentePercepcionIVA: fiscal.emisorAgente.esAgentePercepcionIVA,
        esAgentePercepcionIIBB: fiscal.emisorAgente.esAgentePercepcionIIBB,
      },
      receptor: { condicionIva: input.cliente?.condicionIva ?? "Consumidor Final" },
      subtotalNeto: input.subtotal,
      items: input.lineas.map((l) => ({
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        subtotal: l.subtotal,
        reducido: l.porcentajeIva === 10.5,
        superReducido: l.porcentajeIva === 27,
        exento: l.porcentajeIva === 0,
      })),
      jurisdiccionPrincipal: fiscal.jurisdiccion,
    })

    const tributos = tributosFromBreakdown(breakdown)
    const totalPercepciones = tributos.reduce((sum, t) => sum + t.Importe, 0)
    return {
      totalPercepciones: Math.round(totalPercepciones * 100) / 100,
      tributos,
    }
  } catch {
    return { totalPercepciones: 0, tributos: [] }
  }
}