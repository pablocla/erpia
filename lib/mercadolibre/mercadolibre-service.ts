/**
 * Mercado Libre — OAuth + sync real (publicaciones, pedidos, stock).
 */

import { prisma } from "@/lib/prisma"
import { obtenerCredencialesIntegracion } from "@/lib/integrations/credentials"
import { VentasService } from "@/lib/ventas/ventas-service"
import {
  mlFetch,
  type MLItem,
  type MLItemSearchResult,
  type MLOrderSearchResult,
} from "./mercadolibre-api"

export interface MercadoLibreConfigInput {
  clientId?: string
  clientSecret?: string
  sellerId?: string
  accessToken?: string
  refreshToken?: string
  syncStock?: boolean
  syncPrecios?: boolean
}

export interface PublicacionML {
  id: string
  titulo: string
  precio: number
  stock: number
  estado: "activa" | "pausada" | "cerrada"
  permalink?: string
  sku?: string | null
}

function mapEstadoML(status: string): PublicacionML["estado"] {
  if (status === "active") return "activa"
  if (status === "paused") return "pausada"
  return "cerrada"
}

export async function obtenerConfigML(empresaId: number): Promise<(MercadoLibreConfigInput & { updatedAt?: string }) | null> {
  const { row, credenciales } = await obtenerCredencialesIntegracion(empresaId, "mercado_libre")
  if (!credenciales.accessToken) return null
  return {
    sellerId: credenciales.sellerId,
    accessToken: credenciales.accessToken,
    refreshToken: credenciales.refreshToken,
    updatedAt: row?.updatedAt?.toISOString(),
  }
}

export async function guardarConfigML(empresaId: number, data: MercadoLibreConfigInput) {
  const { guardarCredencialesIntegracion } = await import("@/lib/integrations/credentials")
  return guardarCredencialesIntegracion(empresaId, "mercado_libre", {
    accessToken: data.accessToken ?? "",
    refreshToken: data.refreshToken ?? "",
    sellerId: data.sellerId ?? "",
    clientId: data.clientId ?? "",
    clientSecret: data.clientSecret ?? "",
  })
}

export async function listarPublicaciones(empresaId: number): Promise<PublicacionML[]> {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "mercado_libre")
  if (!credenciales.accessToken || !credenciales.sellerId) return []

  const search = await mlFetch<MLItemSearchResult>(
    empresaId,
    `/users/${credenciales.sellerId}/items/search?status=active&limit=50`,
  )

  const items: PublicacionML[] = []
  for (const itemId of search.results.slice(0, 50)) {
    try {
      const item = await mlFetch<MLItem>(empresaId, `/items/${itemId}`)
      items.push({
        id: item.id,
        titulo: item.title,
        precio: item.price,
        stock: item.available_quantity,
        estado: mapEstadoML(item.status),
        permalink: item.permalink,
        sku: item.seller_custom_field,
      })
    } catch {
      /* skip broken item */
    }
  }
  return items
}

export async function sincronizarStock(empresaId: number) {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "mercado_libre")
  if (!credenciales.accessToken) {
    return { ok: false as const, error: "MERCADO_LIBRE_NO_CONFIGURADO", sincronizados: 0 }
  }

  const publicaciones = await listarPublicaciones(empresaId)
  const skuToItem = new Map<string, string>()
  for (const pub of publicaciones) {
    if (pub.sku) skuToItem.set(pub.sku.toUpperCase(), pub.id)
  }

  const productos = await prisma.producto.findMany({
    where: { empresaId, activo: true },
    select: { id: true, codigo: true, stock: true },
  })

  let sincronizados = 0
  const errores: string[] = []

  for (const prod of productos) {
    if (!prod.codigo) continue
    const itemId = skuToItem.get(prod.codigo.toUpperCase())
    if (!itemId) continue

    try {
      await mlFetch(empresaId, `/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available_quantity: Math.max(0, Math.floor(prod.stock)) }),
      })
      sincronizados++
    } catch (e) {
      errores.push(`${prod.codigo}: ${e instanceof Error ? e.message : "error"}`)
    }
  }

  return {
    ok: true as const,
    sincronizados,
    total: productos.length,
    mensaje: sincronizados > 0
      ? `Stock actualizado en ${sincronizados} publicación(es) ML`
      : "Sin coincidencias SKU ERP ↔ ML (usá seller_custom_field = código producto)",
    errores: errores.length ? errores : undefined,
  }
}

async function resolverClienteML(
  empresaId: number,
  buyer: { id: number; nickname?: string; first_name?: string; last_name?: string },
) {
  const codigo = `ML-${buyer.id}`
  const existente = await prisma.cliente.findFirst({
    where: { empresaId, codigo },
  })
  if (existente) return existente

  const nombre = buyer.nickname
    ?? [buyer.first_name, buyer.last_name].filter(Boolean).join(" ")
    ?? `Comprador ML ${buyer.id}`

  return prisma.cliente.create({
    data: {
      empresaId,
      nombre,
      codigo,
      condicionIva: "Consumidor Final",
      observaciones: "Cliente importado desde Mercado Libre",
    },
  })
}

async function pedidoMLYaImportado(empresaId: number, orderId: string) {
  return prisma.pedidoVenta.findFirst({
    where: {
      empresaId,
      observaciones: { contains: `ML-ORDER:${orderId}` },
    },
  })
}

export async function importarPedidosML(empresaId: number, opts?: { desde?: Date }) {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "mercado_libre")
  if (!credenciales.accessToken || !credenciales.sellerId) {
    return { ok: false as const, error: "MERCADO_LIBRE_NO_CONFIGURADO", importados: 0 }
  }

  const desde = opts?.desde ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const dateFrom = desde.toISOString()
  const search = await mlFetch<MLOrderSearchResult>(
    empresaId,
    `/orders/search?seller=${credenciales.sellerId}&order.status=paid&sort=date_desc&limit=50&order.date_created.from=${encodeURIComponent(dateFrom)}`,
  )

  const ventas = new VentasService()
  let importados = 0
  const omitidos: string[] = []

  for (const order of search.results) {
    const orderId = String(order.id)
    if (await pedidoMLYaImportado(empresaId, orderId)) {
      omitidos.push(orderId)
      continue
    }

    const cliente = await resolverClienteML(empresaId, order.buyer)
    const lineas = []

    for (const oi of order.order_items) {
      const sku = oi.item.seller_custom_field
      let productoId: number | undefined
      if (sku) {
        const prod = await prisma.producto.findFirst({
          where: { empresaId, codigo: sku },
          select: { id: true, nombre: true },
        })
        productoId = prod?.id
      }
      lineas.push({
        productoId,
        descripcion: oi.item.title,
        cantidad: oi.quantity,
        precioUnitario: oi.unit_price,
      })
    }

    if (lineas.length === 0) continue

    await ventas.crearPedidoVenta({
      empresaId,
      clienteId: cliente.id,
      observaciones: `ML-ORDER:${orderId} | Comprador: ${order.buyer.nickname ?? order.buyer.id}`,
      lineas,
      usarListaPrecios: false,
    })
    importados++
  }

  return {
    ok: true as const,
    importados,
    omitidos: omitidos.length,
    total: search.results.length,
  }
}

/** Recibe pedido ML (webhook/manual) y crea PedidoVenta o emite evento n8n */
export async function recibirPedidoML(
  empresaId: number,
  pedido: {
    orderId: string
    buyerNickname?: string
    buyerId?: number
    total: number
    items?: Array<{ sku: string; qty: number; title?: string; unitPrice?: number }>
  },
) {
  if (await pedidoMLYaImportado(empresaId, pedido.orderId)) {
    return { ok: true, orderId: pedido.orderId, duplicado: true }
  }

  const cliente = await resolverClienteML(empresaId, {
    id: pedido.buyerId ?? 0,
    nickname: pedido.buyerNickname,
  })

  const lineas = (pedido.items ?? []).map((it) => ({
    descripcion: it.title ?? `Item ${it.sku}`,
    cantidad: it.qty,
    precioUnitario: it.unitPrice ?? (pedido.total / Math.max(1, pedido.items?.length ?? 1)),
    productoId: undefined as number | undefined,
  }))

  for (let i = 0; i < lineas.length; i++) {
    const sku = pedido.items?.[i]?.sku
    if (sku) {
      const prod = await prisma.producto.findFirst({
        where: { empresaId, codigo: sku },
        select: { id: true },
      })
      if (prod) lineas[i].productoId = prod.id
    }
  }

  if (lineas.length === 0) {
    const { emitToN8n } = await import("@/lib/automation/n8n-bridge")
    const { buildIdempotencyKey } = await import("@/lib/automation/sign-payload")
    await emitToN8n(
      empresaId,
      "PEDIDO_ML_RECIBIDO",
      pedido,
      buildIdempotencyKey(empresaId, "PEDIDO_ML_RECIBIDO", pedido.orderId),
    )
    return { ok: true, orderId: pedido.orderId, via: "n8n" }
  }

  const ventas = new VentasService()
  const pv = await ventas.crearPedidoVenta({
    empresaId,
    clienteId: cliente.id,
    observaciones: `ML-ORDER:${pedido.orderId} | ${pedido.buyerNickname ?? ""}`,
    lineas,
    usarListaPrecios: false,
  })

  return { ok: true, orderId: pedido.orderId, pedidoVentaId: pv.id, numero: pv.numero }
}

export async function resumenML(empresaId: number) {
  const config = await obtenerConfigML(empresaId)
  let publicaciones: PublicacionML[] = []
  if (config?.accessToken) {
    try {
      publicaciones = await listarPublicaciones(empresaId)
    } catch {
      publicaciones = []
    }
  }
  return {
    configurado: !!config?.accessToken,
    publicacionesActivas: publicaciones.filter((p) => p.estado === "activa").length,
    ultimaSync: config?.updatedAt ?? null,
  }
}