import { prisma } from "@/lib/prisma"
import { obtenerCredencialesIntegracion, guardarCredencialesIntegracion } from "@/lib/integrations/credentials"
import {
  crearPedidoDesdeLineas,
  resolverClienteCanal,
} from "@/lib/integrations/ecommerce-helpers"
import { wooFetch, type WooOrder, type WooProduct } from "./woocommerce-api"

export interface ProductoWoo {
  id: number
  nombre: string
  sku: string
  stock: number
  precio: number
  activo: boolean
}

export async function obtenerConfigWoo(empresaId: number) {
  const { row, credenciales } = await obtenerCredencialesIntegracion(empresaId, "woocommerce")
  if (!credenciales.consumerKey) return null
  return {
    siteUrl: credenciales.siteUrl,
    updatedAt: row?.updatedAt?.toISOString(),
  }
}

export async function guardarConfigWoo(
  empresaId: number,
  data: { siteUrl: string; consumerKey: string; consumerSecret: string },
) {
  return guardarCredencialesIntegracion(empresaId, "woocommerce", data, {
    cuentaExterna: data.siteUrl,
    estado: "conectado",
  })
}

export async function listarProductosWoo(empresaId: number): Promise<ProductoWoo[]> {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "woocommerce")
  if (!credenciales.consumerKey) return []

  const productos = await wooFetch<WooProduct[]>(empresaId, "/products?per_page=50&status=publish")
  return productos.map((p) => ({
    id: p.id,
    nombre: p.name,
    sku: p.sku,
    stock: p.stock_quantity ?? 0,
    precio: Number(p.price),
    activo: p.status === "publish",
  }))
}

export async function sincronizarStockWoo(empresaId: number) {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "woocommerce")
  if (!credenciales.consumerKey) {
    return { ok: false as const, error: "WOOCOMMERCE_NO_CONFIGURADO", sincronizados: 0 }
  }

  const productosWoo = await listarProductosWoo(empresaId)
  const skuMap = new Map<string, number>()
  for (const p of productosWoo) {
    if (p.sku) skuMap.set(p.sku.toUpperCase(), p.id)
  }

  const productos = await prisma.producto.findMany({
    where: { empresaId, activo: true },
    select: { codigo: true, stock: true },
  })

  let sincronizados = 0
  const errores: string[] = []

  for (const prod of productos) {
    if (!prod.codigo) continue
    const wooId = skuMap.get(prod.codigo.toUpperCase())
    if (!wooId) continue

    try {
      await wooFetch(empresaId, `/products/${wooId}`, {
        method: "PUT",
        body: JSON.stringify({
          stock_quantity: Math.max(0, Math.floor(prod.stock)),
          manage_stock: true,
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
      ? `Stock actualizado en ${sincronizados} producto(s) WooCommerce`
      : "Sin coincidencias SKU ERP ↔ WooCommerce",
    errores: errores.length ? errores : undefined,
  }
}

export async function importarPedidosWoo(empresaId: number, opts?: { desde?: Date }) {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "woocommerce")
  if (!credenciales.consumerKey) {
    return { ok: false as const, error: "WOOCOMMERCE_NO_CONFIGURADO", importados: 0 }
  }

  const desde = opts?.desde ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const after = desde.toISOString()
  const orders = await wooFetch<WooOrder[]>(
    empresaId,
    `/orders?status=processing,completed&per_page=50&after=${encodeURIComponent(after)}`,
  )

  let importados = 0

  for (const order of orders) {
    const cliente = await resolverClienteCanal(
      empresaId,
      "woo",
      String(order.id),
      {
        nombre: order.billing
          ? [order.billing.first_name, order.billing.last_name].filter(Boolean).join(" ") || `Pedido #${order.number}`
          : `WooCommerce #${order.number}`,
        email: order.billing?.email,
        telefono: order.billing?.phone,
      },
    )

    const result = await crearPedidoDesdeLineas(
      empresaId,
      cliente.id,
      "WOO-ORDER:",
      String(order.id),
      `#${order.number}`,
      order.line_items.map((li) => ({
        descripcion: li.name,
        cantidad: li.quantity,
        precioUnitario: li.price,
        sku: li.sku,
      })),
    )

    if (!result.duplicado && result.pedidoVentaId) importados++
  }

  return { ok: true as const, importados, total: orders.length }
}

export async function resumenWoo(empresaId: number) {
  const config = await obtenerConfigWoo(empresaId)
  let productos: ProductoWoo[] = []
  if (config?.siteUrl) {
    try {
      productos = await listarProductosWoo(empresaId)
    } catch {
      productos = []
    }
  }
  return {
    configurado: !!config?.siteUrl,
    productosActivos: productos.filter((p) => p.activo).length,
    ultimaSync: config?.updatedAt ?? null,
  }
}