/**
 * Parametrización de emisión fiscal POS + salida de impresión.
 * Valores en ParametroFiscal (categoría operativo).
 *
 * Camino principal: AFIP electrónico (WSFE/CAE) + ticket térmico Hasar/Epson ESC/POS.
 * Alternativa: cajero elige ticket sin CAE; o solo ticket operativo.
 */

import { getParametro } from "@/lib/config/parametro-service"
import { prisma } from "@/lib/prisma"
import type {
  ModoComprobantePos,
  TipoDefaultAfip,
} from "@/lib/fiscal/pos-comprobante-policy"

export type SalidaComprobante = "impresora" | "pdf" | "ambos" | "preguntar"

export interface FiscalEmissionConfig {
  /** Cómo se decide el tipo de comprobante en el POS */
  modoComprobante: ModoComprobantePos
  /** Default cuando modo = afip o cajero sin tocar selector */
  tipoDefaultAfip: TipoDefaultAfip
  /** Permite Ticket (sin CAE) aunque el modo sea AFIP (offline / fallback) */
  permitirTicketSinAfip: boolean
  salida: SalidaComprobante
  imprimirAuto: boolean
  incluirQrTicket: boolean
  incluirLogo: boolean
  marcaImpresora: "ninguna" | "hasar" | "epson"
  /** Ancho etiqueta góndola en mm (40 o 50 típico) */
  etiquetaAnchoMm: number
}

const SALIDA_MAP: Record<number, SalidaComprobante> = {
  1: "impresora",
  2: "pdf",
  3: "ambos",
  4: "preguntar",
}

const SALIDA_REVERSE: Record<SalidaComprobante, number> = {
  impresora: 1,
  pdf: 2,
  ambos: 3,
  preguntar: 4,
}

const MODO_MAP: Record<number, ModoComprobantePos> = {
  1: "afip",
  2: "cajero",
  3: "ticket_solo",
}
const MODO_REVERSE: Record<ModoComprobantePos, number> = {
  afip: 1,
  cajero: 2,
  ticket_solo: 3,
}

const TIPO_DEF_MAP: Record<number, TipoDefaultAfip> = {
  0: "auto",
  1: "A",
  2: "B",
  3: "C",
}
const TIPO_DEF_REVERSE: Record<TipoDefaultAfip, number> = {
  auto: 0,
  A: 1,
  B: 2,
  C: 3,
}

export async function getFiscalEmissionConfig(empresaId: number): Promise<FiscalEmissionConfig> {
  const [salidaNum, auto, qr, logo, marca, modoNum, tipoDefNum, permitirTicket, etiqAncho] =
    await Promise.all([
      getParametro(empresaId, "fiscal_salida_comprobante", 4),
      getParametro(empresaId, "fiscal_imprimir_auto", 0),
      getParametro(empresaId, "fiscal_incluir_qr_ticket", 1),
      getParametro(empresaId, "fiscal_incluir_logo_ticket", 0),
      getParametro(empresaId, "fiscal_marca_impresora", 0),
      // Default 1 = AFIP
      getParametro(empresaId, "fiscal_modo_comprobante", 1),
      getParametro(empresaId, "fiscal_tipo_default_afip", 0),
      getParametro(empresaId, "fiscal_permitir_ticket_sin_afip", 1),
      getParametro(empresaId, "fiscal_etiqueta_ancho_mm", 50),
    ])

  const marcaMap: Record<number, FiscalEmissionConfig["marcaImpresora"]> = {
    0: "ninguna",
    1: "hasar",
    2: "epson",
  }

  return {
    modoComprobante: MODO_MAP[modoNum] ?? "afip",
    tipoDefaultAfip: TIPO_DEF_MAP[tipoDefNum] ?? "auto",
    permitirTicketSinAfip: permitirTicket === 1,
    salida: SALIDA_MAP[salidaNum] ?? "preguntar",
    imprimirAuto: auto === 1,
    incluirQrTicket: qr === 1,
    incluirLogo: logo === 1,
    marcaImpresora: marcaMap[marca] ?? "ninguna",
    etiquetaAnchoMm: etiqAncho === 40 ? 40 : 50,
  }
}

export async function saveFiscalEmissionConfig(
  empresaId: number,
  config: Partial<FiscalEmissionConfig>,
): Promise<FiscalEmissionConfig> {
  const current = await getFiscalEmissionConfig(empresaId)
  const merged = { ...current, ...config }
  const db = prisma as typeof prisma & {
    parametroFiscal: {
      upsert: (args: unknown) => Promise<unknown>
    }
  }

  const items: { clave: string; valor: number; descripcion: string }[] = [
    {
      clave: "fiscal_modo_comprobante",
      valor: MODO_REVERSE[merged.modoComprobante],
      descripcion: "1=afip 2=cajero 3=ticket_solo",
    },
    {
      clave: "fiscal_tipo_default_afip",
      valor: TIPO_DEF_REVERSE[merged.tipoDefaultAfip],
      descripcion: "0=auto 1=A 2=B 3=C",
    },
    {
      clave: "fiscal_permitir_ticket_sin_afip",
      valor: merged.permitirTicketSinAfip ? 1 : 0,
      descripcion: "Permite ticket sin CAE como fallback",
    },
    {
      clave: "fiscal_salida_comprobante",
      valor: SALIDA_REVERSE[merged.salida],
      descripcion: "1=impresora 2=pdf 3=ambos 4=preguntar",
    },
    { clave: "fiscal_imprimir_auto", valor: merged.imprimirAuto ? 1 : 0, descripcion: "Imprimir al emitir" },
    { clave: "fiscal_incluir_qr_ticket", valor: merged.incluirQrTicket ? 1 : 0, descripcion: "QR AFIP en ticket" },
    { clave: "fiscal_incluir_logo_ticket", valor: merged.incluirLogo ? 1 : 0, descripcion: "Logo en ticket" },
    {
      clave: "fiscal_marca_impresora",
      valor: merged.marcaImpresora === "hasar" ? 1 : merged.marcaImpresora === "epson" ? 2 : 0,
      descripcion: "0=ninguna 1=hasar 2=epson",
    },
    {
      clave: "fiscal_etiqueta_ancho_mm",
      valor: merged.etiquetaAnchoMm === 40 ? 40 : 50,
      descripcion: "Ancho etiqueta góndola mm",
    },
  ]

  for (const item of items) {
    await db.parametroFiscal.upsert({
      where: {
        empresaId_clave_pais: { empresaId, clave: item.clave, pais: "AR" },
      },
      update: { valor: item.valor, descripcion: item.descripcion, activo: true, categoria: "operativo" },
      create: {
        empresaId,
        clave: item.clave,
        valor: item.valor,
        descripcion: item.descripcion,
        pais: "AR",
        categoria: "operativo",
      },
    })
  }

  const { invalidateConfigCache } = await import("@/lib/config/parametro-service")
  invalidateConfigCache()
  return merged
}