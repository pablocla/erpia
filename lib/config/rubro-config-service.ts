/**
 * Rubro Config Service — Configuración dinámica por rubro y empresa
 *
 * Responsabilidades:
 * - Verificar si una feature está activa para una empresa (herencia rubro → empresa)
 * - Obtener parámetros de una feature (merge rubro defaults + empresa overrides)
 * - Inicializar features de empresa desde template de rubro
 * - Cache en memoria con TTL para evitar queries repetitivas
 */

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

// ─── CACHE ───────────────────────────────────────────────────────────────────

interface CachedFeature {
  activado: boolean
  modoSimplificado: boolean
  parametros: Record<string, unknown>
}

const cache = new Map<string, { data: CachedFeature; expiry: number }>()
const CACHE_TTL_MS = 30_000 // 30 seconds

function cacheKey(empresaId: number, featureKey: string): string {
  return `${empresaId}:${featureKey}`
}

function invalidateCache(empresaId: number): void {
  for (const key of cache.keys()) {
    if (key.startsWith(`${empresaId}:`)) cache.delete(key)
  }
}

// ─── CORE API ────────────────────────────────────────────────────────────────

/**
 * ¿Está activa esta feature para la empresa?
 * Cascada: FeatureEmpresa override → ConfiguracionRubro default → false
 */
export async function isFeatureActiva(empresaId: number, featureKey: string): Promise<boolean> {
  const feature = await getFeatureConfig(empresaId, featureKey)
  return feature.activado
}

/**
 * ¿Está en modo simplificado?
 */
export async function isFeatureSimplificada(empresaId: number, featureKey: string): Promise<boolean> {
  const feature = await getFeatureConfig(empresaId, featureKey)
  return feature.modoSimplificado
}

/**
 * Obtener un parámetro específico de una feature para una empresa.
 * Ej: getFeatureParam(1, "agentes_ia", "diasCobranza", 30) → 15
 */
export async function getFeatureParam<T>(
  empresaId: number,
  featureKey: string,
  paramKey: string,
  fallback: T,
): Promise<T> {
  const feature = await getFeatureConfig(empresaId, featureKey)
  const val = feature.parametros[paramKey]
  return val !== undefined ? (val as T) : fallback
}

/**
 * Obtener la configuración completa de una feature (con merge).
 */
export async function getFeatureConfig(empresaId: number, featureKey: string): Promise<CachedFeature> {
  const key = cacheKey(empresaId, featureKey)
  const cached = cache.get(key)
  if (cached && cached.expiry > Date.now()) return cached.data

  // 1. Buscar override de empresa
  const empresaOverride = await prisma.featureEmpresa.findUnique({
    where: { empresaId_featureKey: { empresaId, featureKey } },
  })

  // 2. Buscar default del rubro de la empresa
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { rubroId: true, rubro: true },
  })

  let rubroDefault: { activado: boolean; modoSimplificado: boolean; parametros: unknown } | null = null

  if (empresa?.rubroId) {
    rubroDefault = await prisma.configuracionRubro.findUnique({
      where: { rubroId_featureKey: { rubroId: empresa.rubroId, featureKey } },
      select: { activado: true, modoSimplificado: true, parametros: true },
    })
  }

  // 3. Merge: empresa override > rubro default > disabled
  const result: CachedFeature = {
    activado: empresaOverride?.activado ?? rubroDefault?.activado ?? false,
    modoSimplificado: empresaOverride?.modoSimplificado ?? rubroDefault?.modoSimplificado ?? false,
    parametros: {
      ...((rubroDefault?.parametros as Record<string, unknown>) ?? {}),
      ...((empresaOverride?.parametros as Record<string, unknown>) ?? {}),
    },
  }

  cache.set(key, { data: result, expiry: Date.now() + CACHE_TTL_MS })
  return result
}

/**
 * Obtener TODAS las features activas de una empresa (para UI de configuración).
 */
export async function getAllFeatures(empresaId: number): Promise<
  { featureKey: string; activado: boolean; modoSimplificado: boolean; grupo: string; label: string; parametros: unknown }[]
> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { rubroId: true },
  })

  // Get all rubro defaults
  const rubroConfigs = empresa?.rubroId
    ? await prisma.configuracionRubro.findMany({ where: { rubroId: empresa.rubroId } })
    : []

  // Get all empresa overrides
  const empresaOverrides = await prisma.featureEmpresa.findMany({
    where: { empresaId },
  })

  const overrideMap = new Map(empresaOverrides.map((o) => [o.featureKey, o]))

  return rubroConfigs.map((rc) => {
    const override = overrideMap.get(rc.featureKey)
    return {
      featureKey: rc.featureKey,
      activado: override?.activado ?? rc.activado,
      modoSimplificado: override?.modoSimplificado ?? rc.modoSimplificado,
      grupo: rc.grupo,
      label: rc.label ?? rc.featureKey,
      parametros: {
        ...((rc.parametros as Record<string, unknown>) ?? {}),
        ...((override?.parametros as Record<string, unknown>) ?? {}),
      },
    }
  })
}

/**
 * Activar/desactivar/configurar una feature para una empresa.
 */
export async function setFeature(
  empresaId: number,
  featureKey: string,
  data: { activado?: boolean; modoSimplificado?: boolean; parametros?: Record<string, unknown> },
): Promise<void> {
  await prisma.featureEmpresa.upsert({
    where: { empresaId_featureKey: { empresaId, featureKey } },
    create: {
      empresaId,
      featureKey,
      activado: data.activado ?? true,
      modoSimplificado: data.modoSimplificado ?? false,
      parametros: data.parametros as Prisma.InputJsonValue | undefined,
    },
    update: {
      ...(data.activado !== undefined && { activado: data.activado }),
      ...(data.modoSimplificado !== undefined && { modoSimplificado: data.modoSimplificado }),
      ...(data.parametros !== undefined && { parametros: data.parametros as Prisma.InputJsonValue }),
    },
  })
  invalidateCache(empresaId)
}

/**
 * Inicializar features de empresa desde template de rubro.
 * Se ejecuta al crear empresa o cambiar de rubro.
 */
export async function inicializarFeaturesDesdeRubro(empresaId: number, rubroId: number): Promise<number> {
  const configs = await prisma.configuracionRubro.findMany({ where: { rubroId } })

  let count = 0
  for (const config of configs) {
    await prisma.featureEmpresa.upsert({
      where: { empresaId_featureKey: { empresaId, featureKey: config.featureKey } },
      create: {
        empresaId,
        featureKey: config.featureKey,
        activado: config.activado,
        modoSimplificado: config.modoSimplificado,
        parametros: config.parametros ?? undefined,
      },
      update: {}, // No sobreescribir si ya existe
    })
    count++
  }

  invalidateCache(empresaId)
  return count
}

// ─── FEATURE KEYS CONSTANTS ──────────────────────────────────────────────────
// Usar estas constantes en los servicios para evitar typos

export const FEATURES = {
  // Core
  POS: "pos",
  STOCK: "stock",
  STOCK_MULTI_DEPOSITO: "stock_multi_deposito",
  FACTURACION_AFIP: "facturacion_afip",
  FACTURA_EXPORTACION: "factura_exportacion",
  CONTABILIDAD: "contabilidad",
  CONTABILIDAD_SIMPLIFICADA: "contabilidad_simplificada",
  PRESUPUESTOS: "presupuestos",
  PEDIDOS_VENTA: "pedidos_venta",
  ORDENES_COMPRA: "ordenes_compra",
  REMITOS: "remitos",
  NOTAS_CREDITO: "notas_credito",
  CHEQUES: "cheques",
  CC_CP: "cc_cp",
  COBROS_PAGOS: "cobros_pagos",
  ACTIVOS_FIJOS: "activos_fijos",
  CENTROS_COSTO: "centros_costo",

  // Fiscal
  IVA_DIGITAL: "iva_digital",
  IIBB: "iibb",
  SICORE: "sicore",
  PERCEPCIONES: "percepciones",
  RETENCIONES: "retenciones",
  AJUSTE_INFLACION: "ajuste_inflacion",
  FACTURA_MIPYMES: "factura_mipymes",
  LIBRO_IVA_DIGITAL: "libro_iva_digital",

  // Verticales
  KDS: "kds",
  MESAS_SALON: "mesas_salon",
  COMANDAS: "comandas",
  RECETAS_BOM: "recetas_bom",
  BOM_PRODUCCION: "bom_produccion",
  ORDENES_PRODUCCION: "ordenes_produccion",
  HISTORIA_CLINICA: "historia_clinica",
  VETERINARIA: "veterinaria",
  TURNOS_AGENDA: "turnos_agenda",
  MEMBRESIAS: "membresias",
  PICKING_WAREHOUSE: "picking_warehouse",
  LOGISTICA: "logistica",
  HOJAS_RUTA: "hojas_ruta",
  IOT_SENSORES: "iot_sensores",
  PORTAL_B2B: "portal_b2b",
  TIENDA_ONLINE: "tienda_online",

  // Integraciones
  WHATSAPP_BUSINESS: "whatsapp_business",
  MERCADO_LIBRE: "mercado_libre",
  EMAIL_NOTIFICACIONES: "email_notificaciones",
  WEBHOOKS_SALIENTES: "webhooks_salientes",
  SSE_REALTIME: "sse_realtime",
  IMPRESORA_FISCAL: "impresora_fiscal",

  // IA
  AGENTES_IA: "agentes_ia",
  CHAT_IA: "chat_ia",
  CLASIFICADOR_PRODUCTOS: "clasificador_productos",
  ONBOARDING_IA: "onboarding_ia",

  // Banco
  CONCILIACION_BANCARIA: "conciliacion_bancaria",
  TRANSFERENCIAS: "transferencias",

  // Listas/Precios
  LISTAS_PRECIO: "listas_precio",
  MULTI_MONEDA: "multi_moneda",
} as const

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES]
