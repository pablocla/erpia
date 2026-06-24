/**
 * Tienda Nube — OAuth + sync real (productos, pedidos, stock).
 */

import { prisma } from "@/lib/prisma"
import { obtenerCredencialesIntegracion, guardarCredencialesIntegracion } from "@/lib/integrations/credentials"
import { VentasService } from "@/lib/ventas/ventas-service"
import { tnFetch, type TNOrder, type TNProduct } from "./tiendanube-api"

export interface ProductoTN {
  id: number
  nombre: string
  sku?: string | null
  stock: number
  precio: number
  publicado: boolean
}

export async function obtenerConfigTN(empresaId: number) {
  const { row, credenciales } = await obtenerCredencialesIntegracion(empresaId, "tienda_nube")
  if (!credenciales.accessToken) return null
  return {
    storeId: credenciales.storeId,
    accessToken: credenciales.accessToken,
    updatedAt: row?.updatedAt?.toISOString(),
  }
}

export async function guardarConfigTN(
  empresaId: number,
  data: { accessToken: string; storeId: string },
) {
  return guardarCredencialesIntegracion(empresaId, "tienda_nube", data)
}

export async function listarProductosTN(empresaId: number): Promise<ProductoTN[]> {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "tienda_nube")
  if (!credenciales.accessToken) return []

  const productos = await tnFetch<TNProduct[]>(empresaId, "/products?per_page=50")
  return productos.map((p) => {
    const v = p.variants[0]
    return {
      id: p.id,
      nombre: p.name?.es ?? `Producto ${p.id}`,
      sku: v?.sku,
      stock: v?.stock ?? 0,
      precio: Number(v?.price ?? 0),
      publicado: p.published,
    }
  })
}

export async function sincronizarStockTN(empresaId: number) {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "tienda_nube")
  if (!credenciales.accessToken) {
    return { ok: false as const, error: "TIENDA_NUBE_NO_CONFIGURADO", sincronizados: 0 }
  }

  const productosTN = await listarProductosTN(empresaId)
  const skuMap = new Map<string, { productId: number; variantId: number }>()
  for (const p of productosTN) {
    if (p.sku) {
      const full = await tnFetch<TNProduct>(empresaId, `/products/${p.id}`)
      const variantId = full.variants[0]?.id
      if (variantId) skuMap.set(p.sku.toUpperCase(), { productId: p.id, variantId })
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
    const mapping = skuMap.get(prod.codigo.toUpperCase())
    if (!mapping) continue

    try {
      await tnFetch(empresaId, `/products/${mapping.productId}/variants/${mapping.variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: Math.max(0, Math.floor(prod.stock)) }),
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
      ? `Stock actualizado en ${sincronizados} variante(s) TN`
      : "Sin coincidencias SKU ERP ↔ Tienda Nube",
    errores: errores.length ? errores : undefined,
  }
}

async function resolverClienteTN(
  empresaId: number,
  customer?: { name?: string; email?: string },
  orderId?: number,
) {
  const codigo = customer?.email ? `TN-${customer.email}` : `TN-ORDER-${orderId}`
  const existente = await prisma.cliente.findFirst({ where: { empresaId, codigo } })
  if (existente) return existente

  return prisma.cliente.create({
    data: {
      empresaId,
      nombre: customer?.name ?? `Cliente TN ${orderId}`,
      codigo,
      email: customer?.email,
      condicionIva: "Consumidor Final",
      observaciones: "Cliente importado desde Tienda Nube",
    },
  })
}

async function pedidoTNYaImportado(empresaId: number, orderId: number) {
  return prisma.pedidoVenta.findFirst({
    where: {
      empresaId,
      observaciones: { contains: `TN-ORDER:${orderId}` },
    },
  })
}

export async function importarPedidosTN(empresaId: number, opts?: { desde?: Date }) {
  const { credenciales } = await obtenerCredencialesIntegracion(empresaId, "tienda_nube")
  if (!credenciales.accessToken) {
    return { ok: false as const, error: "TIENDA_NUBE_NO_CONFIGURADO", importados: 0 }
  }

  const desde = opts?.desde ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const createdAtMin = desde.toISOString().slice(0, 10)
  const orders = await tnFetch<TNOrder[]>(
    empresaId,
    `/orders?per_page=50&created_at_min=${createdAtMin}&payment_status=paid`,
  )

  const ventas = new VentasService()
  let importados = 0

  for (const order of orders) {
    if (await pedidoTNYaImportado(empresaId, order.id)) continue
    if (order.status === "cancelled") continue

    const cliente = await resolverClienteTN(empresaId, order.customer, order.id)
    const lineas = order.products.map((p) => {
      const sku = p.sku
      return {
        descripcion: p.name,
        cantidad: p.quantity,
        precioUnitario: Number(p.price),
        productoId: undefined as number | undefined,
        _sku: sku,
      }
    })

    for (const linea of lineas) {
      if (linea._sku) {
        const prod = await prisma.producto.findFirst({
          where: { empresaId, codigo: linea._sku },
          select: { id: true },
        })
        if (prod) linea.productoId = prod.id
      }
    }

    await ventas.crearPedidoVenta({
      empresaId,
      clienteId: cliente.id,
      observaciones: `TN-ORDER:${order.id} | Pedido #${order.number}`,
      lineas: lineas.map(({ _sku: _, ...l }) => l),
      usarListaPrecios: false,
    })
    importados++
  }

  return { ok: true as const, importados, total: orders.length }
}

export async function recibirPedidoTN(
  empresaId: number,
  order: TNOrder,
) {
  if (await pedidoTNYaImportado(empresaId, order.id)) {
    return { ok: true, orderId: order.id, duplicado: true }
  }

  const cliente = await resolverClienteTN(empresaId, order.customer, order.id)
  const ventas = new VentasService()

  const lineas = await Promise.all(order.products.map(async (p) => {
    let productoId: number | undefined
    if (p.sku) {
      const prod = await prisma.producto.findFirst({
        where: { empresaId, codigo: p.sku },
        select: { id: true },
      })
      productoId = prod?.id
    }
    return {
      productoId,
      descripcion: p.name,
      cantidad: p.quantity,
      precioUnitario: Number(p.price),
    }
  }))

  const pv = await ventas.crearPedidoVenta({
    empresaId,
    clienteId: cliente.id,
    observaciones: `TN-ORDER:${order.id} | Pedido #${order.number}`,
    lineas,
    usarListaPrecios: false,
  })

  return { ok: true, orderId: order.id, pedidoVentaId: pv.id, numero: pv.numero }
}

export async function resumenTN(empresaId: number) {
  const config = await obtenerConfigTN(empresaId)
  let productos: ProductoTN[] = []
  if (config?.accessToken) {
    try {
      productos = await listarProductosTN(empresaId)
    } catch {
      productos = []
    }
  }
  return {
    configurado: !!config?.accessToken,
    productosPublicados: productos.filter((p) => p.publicado).length,
    ultimaSync: config?.updatedAt ?? null,
  }
}