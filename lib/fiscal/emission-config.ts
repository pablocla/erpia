/**
 * Parametrización de salida fiscal — PDF / impresora / ambos.
 * Valores almacenados en ParametroFiscal (categoría operativo).
 */

import { getParametro } from "@/lib/config/parametro-service"
import { prisma } from "@/lib/prisma"

export type SalidaComprobante = "impresora" | "pdf" | "ambos" | "preguntar"

export interface FiscalEmissionConfig {
  salida: SalidaComprobante
  imprimirAuto: boolean
  incluirQrTicket: boolean
  incluirLogo: boolean
  marcaImpresora: "ninguna" | "hasar" | "epson"
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

export async function getFiscalEmissionConfig(empresaId: number): Promise<FiscalEmissionConfig> {
  const [salidaNum, auto, qr, logo, marca] = await Promise.all([
    getParametro(empresaId, "fiscal_salida_comprobante", 4),
    getParametro(empresaId, "fiscal_imprimir_auto", 0),
    getParametro(empresaId, "fiscal_incluir_qr_ticket", 1),
    getParametro(empresaId, "fiscal_incluir_logo_ticket", 0),
    getParametro(empresaId, "fiscal_marca_impresora", 0),
  ])

  const marcaMap: Record<number, FiscalEmissionConfig["marcaImpresora"]> = {
    0: "ninguna",
    1: "hasar",
    2: "epson",
  }

  return {
    salida: SALIDA_MAP[salidaNum] ?? "preguntar",
    imprimirAuto: auto === 1,
    incluirQrTicket: qr === 1,
    incluirLogo: logo === 1,
    marcaImpresora: marcaMap[marca] ?? "ninguna",
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