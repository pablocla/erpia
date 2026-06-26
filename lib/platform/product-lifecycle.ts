/**
 * Ciclo de vida unificado: activar / desactivar productos horizontales.
 * Sincroniza suscripcionModulo + featureEmpresa + hooks de provisión.
 */

import { prisma } from "@/lib/prisma"
import { upsertSuscripcion, getActiveSubscription } from "./commercial-service"
import { SKU_TO_FEATURE } from "./sku-catalog"
import { setFeature } from "@/lib/config/rubro-config-service"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import {
  getProductoHorizontal,
  getPackHorizontal,
  PRODUCTOS_HORIZONTALES,
  PACKS_HORIZONTALES,
  type ProductoHorizontal,
} from "./product-registry"
import { getProductHooks } from "./product-hooks"

export interface ProductoEstado {
  sku: string
  nombre: string
  lema: string
  tier: string
  activo: boolean
  dependeDe: string[]
  dependenciasOk: boolean
  dependenciasFaltantes: string[]
  navPaths: string[]
  precioArs: number
}

export interface ProductosResumen {
  productos: ProductoEstado[]
  mapa: Record<string, boolean>
  packs: { id: string; nombre: string; lema: string; skus: string[]; todoActivo: boolean; algunoActivo: boolean }[]
}

function featureKeyForSku(sku: string): string {
  return SKU_TO_FEATURE[sku] ?? sku
}

async function dependenciasSatisfechas(empresaId: number, producto: ProductoHorizontal) {
  const faltantes: string[] = []
  for (const dep of producto.dependeDe) {
    const sub = await getActiveSubscription(empresaId, dep)
    if (!sub) faltantes.push(dep)
  }
  return { ok: faltantes.length === 0, faltantes }
}

export async function activarProducto(empresaId: number, sku: string, origen = "manual") {
  const producto = getProductoHorizontal(sku)
  if (producto) {
    const deps = await dependenciasSatisfechas(empresaId, producto)
    if (!deps.ok) {
      throw new Error(`Faltan dependencias: ${deps.faltantes.join(", ")}`)
    }
  }

  await upsertSuscripcion(empresaId, {
    sku,
    activo: true,
    metadata: { origen, activadoAt: new Date().toISOString() },
  })

  await setFeature(empresaId, producto?.featureKey ?? featureKeyForSku(sku), { activado: true })

  const hooks = getProductHooks(sku)
  if (hooks?.onActivate) {
    await hooks.onActivate(empresaId)
  }

  await persistSistemaLog({
    empresaId,
    severidad: "info",
    categoria: "productos",
    contexto: "product-lifecycle",
    mensaje: `Producto ${sku} activado (${origen})`,
    metadata: { sku, origen },
  })

  return { ok: true, sku, origen }
}

export async function desactivarProducto(empresaId: number, sku: string, origen = "manual") {
  const producto = getProductoHorizontal(sku)

  await upsertSuscripcion(empresaId, {
    sku,
    activo: false,
    metadata: { origen, desactivadoAt: new Date().toISOString() },
  })

  await setFeature(empresaId, producto?.featureKey ?? featureKeyForSku(sku), { activado: false })

  const hooks = getProductHooks(sku)
  if (hooks?.onDeactivate) {
    await hooks.onDeactivate(empresaId)
  }

  await persistSistemaLog({
    empresaId,
    severidad: "info",
    categoria: "productos",
    contexto: "product-lifecycle",
    mensaje: `Producto ${sku} desactivado (${origen})`,
    metadata: { sku, origen },
  })

  return { ok: true, sku, origen }
}

export async function activarPack(empresaId: number, packId: string, origen = "pack") {
  const pack = getPackHorizontal(packId)
  if (!pack) throw new Error(`Pack no encontrado: ${packId}`)

  const results = []
  for (const sku of pack.skus) {
    const r = await activarProducto(empresaId, sku, `${origen}:${packId}`)
    results.push(r)
  }
  return { packId, activados: results.length, results }
}

export async function desactivarPack(empresaId: number, packId: string, origen = "pack") {
  const pack = getPackHorizontal(packId)
  if (!pack) throw new Error(`Pack no encontrado: ${packId}`)

  const results = []
  for (const sku of [...pack.skus].reverse()) {
    const r = await desactivarProducto(empresaId, sku, `${origen}:${packId}`)
    results.push(r)
  }
  return { packId, desactivados: results.length, results }
}

export async function obtenerEstadoProductos(empresaId: number): Promise<ProductosResumen> {
  const suscripciones = await prisma.suscripcionModulo.findMany({
    where: { empresaId },
    select: { sku: true, activo: true },
  })
  const subMap = new Map(suscripciones.map((s) => [s.sku, s.activo]))

  const productos: ProductoEstado[] = []
  const mapa: Record<string, boolean> = {}

  for (const p of PRODUCTOS_HORIZONTALES) {
    const activo = subMap.get(p.sku) === true
    const deps = await dependenciasSatisfechas(empresaId, p)
    productos.push({
      sku: p.sku,
      nombre: p.nombre,
      lema: p.lema,
      tier: p.tier,
      activo,
      dependeDe: p.dependeDe,
      dependenciasOk: deps.ok,
      dependenciasFaltantes: deps.faltantes,
      navPaths: p.navPaths,
      precioArs: p.precioArs,
    })
    mapa[p.sku] = activo
  }

  const packs = PACKS_HORIZONTALES.map((pack) => {
    const estados = pack.skus.map((s) => mapa[s] === true)
    return {
      id: pack.id,
      nombre: pack.nombre,
      lema: pack.lema,
      skus: pack.skus,
      todoActivo: estados.every(Boolean),
      algunoActivo: estados.some(Boolean),
    }
  })

  return { productos, mapa, packs }
}

export async function estaProductoActivo(empresaId: number, sku: string): Promise<boolean> {
  const sub = await getActiveSubscription(empresaId, sku)
  return !!sub
}