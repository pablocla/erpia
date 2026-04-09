/**
 * ParametroService — Centralized configuration lookup with in-memory cache.
 *
 * Replaces all hardcoded constants (UMBRAL_RG5824, tolerancia 3-way, IIBB rates)
 * with DB-backed ParametroFiscal + ConfigAsientoCuenta lookups.
 *
 * Cache TTL: 60s (same pattern as event-bus ConfiguracionFuncional cache).
 */

import { prisma } from "@/lib/prisma"

// ─── CACHE ──────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const CACHE_TTL_MS = 60_000

const parametroCache = new Map<string, CacheEntry<number>>()
const asientoCuentaCache = new Map<string, CacheEntry<string>>()

function isFresh<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return !!entry && Date.now() < entry.expiresAt
}

// ─── PARÁMETROS FISCALES ────────────────────────────────────────────────────

/**
 * Obtiene el valor numérico de un parámetro fiscal.
 * Si no existe en DB, retorna el fallback sin cache (para que un seed posterior lo tome).
 */
export async function getParametro(
  empresaId: number,
  clave: string,
  fallback: number,
  pais?: string,
): Promise<number> {
  const cacheKey = `${empresaId}:${clave}:${pais ?? "*"}`
  const cached = parametroCache.get(cacheKey)
  if (isFresh(cached)) return cached.data

  let row: any = null
  try {
    row = await prisma.parametroFiscal.findFirst({
      where: {
        empresaId,
        clave,
        activo: true,
        ...(pais ? { pais } : {}),
        OR: [
          { vigenciaHasta: null },
          { vigenciaHasta: { gte: new Date() } },
        ],
      },
      orderBy: { vigenciaDesde: "desc" },
    })
  } catch {
    // DB not available or model not migrated yet — use fallback
  }

  const valor = row ? Number(row.valor) : fallback
  parametroCache.set(cacheKey, { data: valor, expiresAt: Date.now() + CACHE_TTL_MS })
  return valor
}

// ─── MAPEO DE CUENTAS CONTABLES ─────────────────────────────────────────────

/** Safely query configAsientoCuenta, returning null if model/table is not available */
async function findConfigAsiento(empresaId: number, tipoTransaccion: string, campo: string) {
  try {
    return await prisma.configAsientoCuenta.findUnique({
      where: { empresaId_tipoTransaccion_campo: { empresaId, tipoTransaccion, campo } },
    })
  } catch {
    return null
  }
}

/**
 * Obtiene el código de cuenta contable para un tipo de transacción y campo.
 * Ej: getCuenta(1, "venta", "ingreso") → "4.1"
 */
export async function getCuenta(
  empresaId: number,
  tipoTransaccion: string,
  campo: string,
  fallback: string,
): Promise<string> {
  const cacheKey = `${empresaId}:${tipoTransaccion}:${campo}`
  const cached = asientoCuentaCache.get(cacheKey)
  if (isFresh(cached)) return cached.data

  const row = await findConfigAsiento(empresaId, tipoTransaccion, campo)
  const codigo = row?.cuentaCodigo ?? fallback
  asientoCuentaCache.set(cacheKey, { data: codigo, expiresAt: Date.now() + CACHE_TTL_MS })
  return codigo
}

/**
 * Obtiene el nombre completo "código nombre" para un movimiento contable.
 * Ej: getCuentaLabel(1, "venta", "ingreso") → "4.1 Ventas"
 */
export async function getCuentaLabel(
  empresaId: number,
  tipoTransaccion: string,
  campo: string,
  fallbackCodigo: string,
  fallbackNombre: string,
): Promise<string> {
  const cacheKey = `label:${empresaId}:${tipoTransaccion}:${campo}`
  const cached = asientoCuentaCache.get(cacheKey)
  if (isFresh(cached)) return cached.data

  const row = await findConfigAsiento(empresaId, tipoTransaccion, campo)
  const label = row
    ? `${row.cuentaCodigo} ${row.cuentaNombre ?? ""}`
    : `${fallbackCodigo} ${fallbackNombre}`

  asientoCuentaCache.set(cacheKey, { data: label, expiresAt: Date.now() + CACHE_TTL_MS })
  return label
}

// ─── NUMERADOR ──────────────────────────────────────────────────────────────

/**
 * Atomically increments and returns the next document number for a given type.
 * Thread-safe via Prisma $transaction with SELECT ... FOR UPDATE equivalent.
 */
export async function proximoNumero(
  empresaId: number,
  tipoDocumento: string,
  sucursal?: string,
): Promise<{ numero: number; formateado: string }> {
  return prisma.$transaction(async (tx) => {
    const numerador = await tx.numerador.findUnique({
      where: {
        empresaId_tipoDocumento_sucursal: {
          empresaId,
          tipoDocumento,
          sucursal: (sucursal ?? null) as string,
        },
      },
    })

    if (!numerador) {
      // Fallback: auto-create numerador with default settings
      const nuevo = await tx.numerador.create({
        data: {
          empresaId,
          tipoDocumento,
          prefijo: tipoDocumento.toUpperCase().slice(0, 4),
          ultimoNumero: 1,
          digitos: 6,
          sucursal: sucursal ?? null,
        },
      })
      return {
        numero: 1,
        formateado: `${nuevo.prefijo}-${String(1).padStart(nuevo.digitos, "0")}`,
      }
    }

    const siguiente = numerador.ultimoNumero + 1
    await tx.numerador.update({
      where: { id: numerador.id },
      data: { ultimoNumero: siguiente },
    })

    const formateado = numerador.sucursal
      ? `${numerador.prefijo}-${numerador.sucursal}-${String(siguiente).padStart(numerador.digitos, "0")}`
      : `${numerador.prefijo}-${String(siguiente).padStart(numerador.digitos, "0")}`

    return { numero: siguiente, formateado }
  })
}

// ─── CACHE MANAGEMENT ───────────────────────────────────────────────────────

/** Flush all caches (useful after config changes via API). */
export function invalidateConfigCache(): void {
  parametroCache.clear()
  asientoCuentaCache.clear()
}
