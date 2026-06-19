/**
 * Mercado Libre — integración stub (publicaciones + sync stock).
 * Listo para cablear API real de ML cuando haya credenciales OAuth.
 */

import { prisma } from "@/lib/prisma"

export interface MercadoLibreConfigInput {
  clientId: string
  clientSecret: string
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
}

export async function obtenerConfigML(empresaId: number) {
  const row = await prisma.configuracionFuncional.findFirst({
    where: { empresaId, clave: "mercado_libre_config" },
  })
  if (!row?.valor) return null
  try {
    return JSON.parse(row.valor) as MercadoLibreConfigInput & { updatedAt?: string }
  } catch {
    return null
  }
}

export async function guardarConfigML(empresaId: number, data: MercadoLibreConfigInput) {
  const payload = JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
  const existing = await prisma.configuracionFuncional.findFirst({
    where: { empresaId, clave: "mercado_libre_config" },
  })

  if (existing) {
    return prisma.configuracionFuncional.update({
      where: { id: existing.id },
      data: { valor: payload },
    })
  }

  return prisma.configuracionFuncional.create({
    data: {
      empresaId,
      clave: "mercado_libre_config",
      valor: payload,
      tipo: "json",
    },
  })
}

/** Stub: devuelve publicaciones de ejemplo hasta conectar OAuth ML */
export async function listarPublicaciones(_empresaId: number): Promise<PublicacionML[]> {
  return []
}

/** Stub: simula sync de stock ERP → ML */
export async function sincronizarStock(empresaId: number) {
  const config = await obtenerConfigML(empresaId)
  if (!config?.accessToken) {
    return { ok: false, error: "MERCADO_LIBRE_NO_CONFIGURADO", sincronizados: 0 }
  }

  const productos = await prisma.producto.findMany({
    where: { empresaId, activo: true },
    take: 50,
    select: { id: true, nombre: true, stock: true, precioVenta: true },
  })

  return {
    ok: true,
    sincronizados: productos.length,
    mensaje: "Sync stub — conectar API ML para publicar cambios reales",
  }
}

/** Stub: recibe pedido ML y emite evento hacia n8n */
export async function recibirPedidoML(
  empresaId: number,
  pedido: {
    orderId: string
    buyerNickname?: string
    total: number
    items?: Array<{ sku: string; qty: number }>
  }
) {
  const { emitToN8n } = await import("@/lib/automation/n8n-bridge")
  const { buildIdempotencyKey } = await import("@/lib/automation/sign-payload")
  await emitToN8n(
    empresaId,
    "PEDIDO_ML_RECIBIDO",
    pedido,
    buildIdempotencyKey(empresaId, "PEDIDO_ML_RECIBIDO", pedido.orderId)
  )
  return { ok: true, orderId: pedido.orderId }
}

export async function resumenML(empresaId: number) {
  const config = await obtenerConfigML(empresaId)
  const publicaciones = await listarPublicaciones(empresaId)
  return {
    configurado: !!config?.accessToken,
    publicacionesActivas: publicaciones.filter((p) => p.estado === "activa").length,
    ultimaSync: config?.updatedAt ?? null,
  }
}