import { prisma } from "@/lib/prisma"
import type {
  ProductoCreadoPayload,
  ProductoActualizadoPayload,
  ProductoEliminadoPayload,
} from "@/lib/events/types"

export type POSSyncAction = "create" | "update" | "delete"

/**
 * Sincroniza cambios de productos con el catálogo POS.
 * Actualmente es una implementación segura y no bloqueante,
 * ideal para mantener el flujo de eventos sin romper el build.
 */
export async function syncPOSCatalog(
  productoId: number,
  action: POSSyncAction,
  payload: ProductoCreadoPayload | ProductoActualizadoPayload | ProductoEliminadoPayload,
): Promise<void> {
  try {
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        precioVenta: true,
        precioCompra: true,
        porcentajeIva: true,
        activo: true,
      },
    })

    if (!producto) {
      console.warn(`[POS SYNC] Producto no encontrado: ${productoId}`)
      return
    }

    console.info(
      `[POS SYNC] Acción=${action} productoId=${productoId} empresaId=${payload.empresaId}`,
    )

    // Aquí puede implementarse la lógica real de sincronización con el catálogo POS / e-commerce.
    // Por ahora se deja como no-op para evitar bloqueos en el flujo de eventos.
  } catch (error) {
    console.error("[POS SYNC] Error sincronizando catálogo POS:", error)
  }
}
