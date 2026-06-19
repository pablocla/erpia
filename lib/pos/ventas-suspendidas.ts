/**
 * Ventas suspendidas del POS — persistencia local (turno del cajero).
 */

export const POS_SUSPENDIDAS_KEY = "pos_ventas_suspendidas"

export interface ItemSuspendido {
  productoId: number
  descripcion: string
  precio: number
  cantidad: number
  porcentajeIva: number
  descuento: number
}

export interface VentaSuspendida {
  id: string
  createdAt: string
  items: ItemSuspendido[]
  total: number
  clienteId?: number | null
  mesaId?: number | null
  descuentoGlobal?: number
  tipoFactura?: string
}

function readAll(): VentaSuspendida[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(POS_SUSPENDIDAS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(ventas: VentaSuspendida[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(POS_SUSPENDIDAS_KEY, JSON.stringify(ventas))
}

export function listarVentasSuspendidas(): VentaSuspendida[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function contarVentasSuspendidas(): number {
  return readAll().length
}

export function guardarVentaSuspendida(
  data: Omit<VentaSuspendida, "id" | "createdAt">
): VentaSuspendida {
  const venta: VentaSuspendida = {
    ...data,
    id: `vs-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  writeAll([venta, ...readAll()])
  return venta
}

export function eliminarVentaSuspendida(id: string) {
  writeAll(readAll().filter((v) => v.id !== id))
}