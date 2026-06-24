/**
 * Parametrización CAEA por empresa (RG 5782 — contingencia offline).
 * Persistencia vía ParametroFiscal (valores numéricos, sin migración de schema).
 */
import { getParametro } from "@/lib/config/parametro-service"
import { prisma } from "@/lib/prisma"

/** 0 = fallback automático si AFIP no responde | 1 = deshabilitado | 2 = preferir CAEA si vigente */
export type CaeaModoEmision = 0 | 1 | 2

export interface CaeaConfig {
  habilitado: boolean
  modoEmision: CaeaModoEmision
  autoInformar: boolean
  autoSolicitar: boolean
}

export interface CaeaVigencia {
  vigente: boolean
  caea: string | null
  vigDesde: Date | null
  vigHasta: Date | null
  topeInformar: Date | null
  diasParaVencer: number | null
}

export const CAEA_PARAM_KEYS = {
  habilitado: "caea_habilitado",
  modoEmision: "caea_modo_emision",
  autoInformar: "caea_auto_informar",
  autoSolicitar: "caea_auto_solicitar",
} as const

export const CAEA_MODO_LABELS: Record<CaeaModoEmision, string> = {
  0: "Automático — usar CAEA solo si AFIP no responde",
  1: "Deshabilitado — solo CAE online (queda pendiente_cae)",
  2: "Preferir CAEA — si hay CAEA vigente, omitir CAE online",
}

export async function getCaeaConfig(empresaId: number): Promise<CaeaConfig> {
  const [habilitado, modo, autoInformar, autoSolicitar] = await Promise.all([
    getParametro(empresaId, CAEA_PARAM_KEYS.habilitado, 1, "AR"),
    getParametro(empresaId, CAEA_PARAM_KEYS.modoEmision, 0, "AR"),
    getParametro(empresaId, CAEA_PARAM_KEYS.autoInformar, 1, "AR"),
    getParametro(empresaId, CAEA_PARAM_KEYS.autoSolicitar, 0, "AR"),
  ])

  const modoEmision = ([0, 1, 2] as const).includes(modo as CaeaModoEmision)
    ? (modo as CaeaModoEmision)
    : 0

  return {
    habilitado: habilitado >= 1,
    modoEmision,
    autoInformar: autoInformar >= 1,
    autoSolicitar: autoSolicitar >= 1,
  }
}

export async function saveCaeaConfig(empresaId: number, config: Partial<CaeaConfig>): Promise<CaeaConfig> {
  const items: Array<{ clave: string; valor: number; descripcion: string }> = []

  if (config.habilitado !== undefined) {
    items.push({
      clave: CAEA_PARAM_KEYS.habilitado,
      valor: config.habilitado ? 1 : 0,
      descripcion: "Habilitar emisión con CAEA en contingencia",
    })
  }
  if (config.modoEmision !== undefined) {
    items.push({
      clave: CAEA_PARAM_KEYS.modoEmision,
      valor: config.modoEmision,
      descripcion: "Modo de emisión CAEA (0=auto fallback, 1=deshabilitado, 2=preferir CAEA)",
    })
  }
  if (config.autoInformar !== undefined) {
    items.push({
      clave: CAEA_PARAM_KEYS.autoInformar,
      valor: config.autoInformar ? 1 : 0,
      descripcion: "Informar comprobantes CAEA automáticamente en sync/cron",
    })
  }
  if (config.autoSolicitar !== undefined) {
    items.push({
      clave: CAEA_PARAM_KEYS.autoSolicitar,
      valor: config.autoSolicitar ? 1 : 0,
      descripcion: "Solicitar CAEA automáticamente al inicio de quincena (cron)",
    })
  }

  for (const item of items) {
    await prisma.parametroFiscal.upsert({
      where: {
        empresaId_clave_pais: { empresaId, clave: item.clave, pais: "AR" },
      },
      update: { valor: item.valor, descripcion: item.descripcion, activo: true },
      create: {
        empresaId,
        clave: item.clave,
        valor: item.valor,
        descripcion: item.descripcion,
        pais: "AR",
        categoria: "fiscal",
        normativa: "RG 5782/2025",
      },
    })
  }

  return getCaeaConfig(empresaId)
}

export async function getCaeaVigencia(empresaId: number): Promise<CaeaVigencia> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: {
      caeaVigente: true,
      caeaVigDesde: true,
      caeaVigHasta: true,
      caeaTopeInformar: true,
    },
  })

  if (!empresa) {
    return {
      vigente: false,
      caea: null,
      vigDesde: null,
      vigHasta: null,
      topeInformar: null,
      diasParaVencer: null,
    }
  }

  const ahora = new Date()
  const vigente = Boolean(
    empresa.caeaVigente &&
    empresa.caeaVigHasta &&
    ahora <= new Date(empresa.caeaVigHasta),
  )

  return {
    vigente,
    caea: empresa.caeaVigente,
    vigDesde: empresa.caeaVigDesde,
    vigHasta: empresa.caeaVigHasta,
    topeInformar: empresa.caeaTopeInformar,
    diasParaVencer: empresa.caeaVigHasta
      ? Math.ceil((new Date(empresa.caeaVigHasta).getTime() - ahora.getTime()) / 86400000)
      : null,
  }
}

export function isAfipNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase()
  return (
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("enotfound") ||
    msg.includes("socket hang up") ||
    msg.includes("timeout") ||
    msg.includes("network") ||
    msg.includes("afip no disponible")
  )
}

export function debeIntentarCaea(config: CaeaConfig, motivo: "fallback" | "preferir"): boolean {
  if (!config.habilitado) return false
  if (config.modoEmision === 1) return false
  if (motivo === "preferir") return config.modoEmision === 2
  return config.modoEmision === 0
}