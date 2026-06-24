import { prisma } from "@/lib/prisma"
import { obtenerCredencialesIntegracion, guardarCredencialesIntegracion } from "@/lib/integrations/credentials"
import {
  crearPedidoDesdeLineas,
  resolverClienteCanal,
} from "@/lib/integrations/ecommerce-helpers"
import {
  shopifyFetch,
  type ShopifyLocation,
  type ShopifyOrder,
  type ShopifyProduct,
  normalizeShopDomain,
} from "./shopify-api"

export interface ProductoShopify {
  id: number
  nombre: string
  sku?: string | null
  stock: number
  precio: number
  activo: boolean
}

export async function obtenerConfigShopify(empresaId: number) {
  const { row, credenciales } = await obtenerCredencialesIntegracion(empresaId, "shopify")
  if (!credenciales.accessToken) return null
  return {
    shopDomain: credenciales.shopDomain,
    updatedAt: row?.updatedAt?.toISOString(),
  }
}

export async function guardarConfigShopify(
  empresaId: number,
  data: { accessToken?: string; shopDomain: string },
) {
  return guardarCredencialesIntegracion(empresaId, "shopify", {
    accessToken: data.accessToken ?? "",
    shopDomain: normalizeShopDomain(data.shopDomain),
  })
}

export async function listarProductosShopify(empresaId: number): Promise<ProductoShopify[]> {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "shopify")
  if (!credenciales.accessToken) return []

  const data = await shopifyFetch<{ products: ShopifyProduct[] }>(empresaId, "/products.json?limit=50&status=active")
  return data.products.map((p) => {
    const v = p.variants[0]
    return {
      id: p.id,
      nombre: p.title,
      sku: v?.sku,
      stock: v?.inventory_quantity ?? 0,
      precio: Number(v?.price ?? 0),
      activo: p.status === "active",
    }
  })
}

export async function sincronizarStockShopify(empresaId: number) {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "shopify")
  if (!credenciales.accessToken) {
    return { ok: false as const, error: "SHOPIFY_NO_CONFIGURADO", sincronizados: 0 }
  }

  const locData = await shopifyFetch<{ locations: ShopifyLocation[] }>(empresaId, "/locations.json")
  const location = locData.locations.find((l) => l.active)
  if (!location) {
    return { ok: false as const, error: "SHOPIFY_SIN_UBICACION", sincronizados: 0 }
  }

  const data = await shopifyFetch<{ products: ShopifyProduct[] }>(empresaId, "/products.json?limit=100")
  const skuMap = new Map<string, number>()
  for (const p of data.products) {
    for (const v of p.variants) {
      if (v.sku && v.inventory_item_id) {
        skuMap.set(v.sku.toUpperCase(), v.inventory_item_id)
      }
    }
  }

  const productos = await prisma.producto.findMany({
    where: { empresaId, activo: true },
    select: { codigo: true, stock: true },
  })

  let sincronizados = 0
  const errores: string[] = []

  for (const prod of productos) {
    if (!prod.codigo) continue
    const itemId = skuMap.get(prod.codigo.toUpperCase())
    if (!itemId) continue

    try {
      await shopifyFetch(empresaId, "/inventory_levels/set.json", {
        method: "POST",
        body: JSON.stringify({
          location_id: location.id,
          inventory_item_id: itemId,
          available: Math.max(0, Math.floor(prod.stock)),
        }),
      })
      sincronizados++
    } catch (e) {
      errores.push(`${prod.codigo}: ${e instanceof Error ? e.message : "error"}`)
    }
  }

  return {
    ok: true as const,
    sincronizados,
    mensaje: sincronizados > 0
      ? `Stock actualizado en ${sincronizados} variante(s) Shopify`
      : "Sin coincidencias SKU ERP ↔ Shopify",
    errores: errores.length ? errores : undefined,
  }
}

export async function importarPedidosShopify(empresaId: number, opts?: { desde?: Date }) {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "shopify")
  if (!credenciales.accessToken) {
    return { ok: false as const, error: "SHOPIFY_NO_CONFIGURADO", importados: 0 }
  }

  const desde = opts?.desde ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const createdMin = desde.toISOString()
  const data = await shopifyFetch<{ orders: ShopifyOrder[] }>(
    empresaId,
    `/orders.json?status=any&financial_status=paid&created_at_min=${encodeURIComponent(createdMin)}&limit=50`,
  )

  let importados = 0

  for (const order of data.orders) {
    const cliente = await resolverClienteCanal(
      empresaId,
      "shopify",
      String(order.id),
      {
        nombre: order.customer
          ? [order.customer.first_name, order.customer.last_name].filter(Boolean).join(" ") || `Pedido ${order.name}`
          : `Shopify ${order.name}`,
        email: order.customer?.email ?? order.email,
      },
    )

    const result = await crearPedidoDesdeLineas(
      empresaId,
      cliente.id,
      "SHOPIFY-ORDER:",
      String(order.id),
      order.name,
      order.line_items.map((li) => ({
        descripcion: li.name,
        cantidad: li.quantity,
        precioUnitario: Number(li.price),
        sku: li.sku,
      })),
    )

    if (!result.duplicado && result.pedidoVentaId) importados++
  }

  return { ok: true as const, importados, total: data.orders.length }
}

export async function recibirPedidoShopify(empresaId: number, order: ShopifyOrder) {
  const cliente = await resolverClienteCanal(
    empresaId,
    "shopify",
    String(order.id),
    {
      nombre: order.customer
        ? [order.customer.first_name, order.customer.last_name].filter(Boolean).join(" ") || order.name
        : order.name,
      email: order.customer?.email ?? order.email,
    },
  )

  return crearPedidoDesdeLineas(
    empresaId,
    cliente.id,
    "SHOPIFY-ORDER:",
    String(order.id),
    order.name,
    order.line_items.map((li) => ({
      descripcion: li.name,
      cantidad: li.quantity,
      precioUnitario: Number(li.price),
      sku: li.sku,
    })),
  )
}

export async function resumenShopify(empresaId: number) {
  const config = await obtenerConfigShopify(empresaId)
  let productos: ProductoShopify[] = []
  if (config?.shopDomain) {
    try {
      productos = await listarProductosShopify(empresaId)
    } catch {
      productos = []
    }
  }
  return {
    configurado: !!config?.shopDomain,
    productosActivos: productos.filter((p) => p.activo).length,
    ultimaSync: config?.updatedAt ?? null,
  }
}