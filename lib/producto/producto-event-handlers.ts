import { eventBus } from "@/lib/events/event-bus"
import { invalidateContextCache } from "@/lib/ai"
import { syncPOSCatalog } from "../pos/sync-service"
import type {
  ProductoCreadoPayload,
  ProductoActualizadoPayload,
  ProductoEliminadoPayload,
} from "@/lib/events/types"

async function safeInvalidateCache(empresaId: number) {
  try {
    invalidateContextCache(empresaId)
  } catch (error) {
    console.error("[EVENT] Error invalidando cache de contexto AI para producto:", error)
  }
}

// Handler for PRODUCTO_CREADO
eventBus.on<ProductoCreadoPayload>("PRODUCTO_CREADO", "producto_creado_sync_pos", async (event) => {
  await safeInvalidateCache(event.payload.empresaId)
  await syncPOSCatalog(event.payload.productoId, "create", event.payload)
  console.info(
    `[EVENT] PRODUCTO_CREADO -> productoId=${event.payload.productoId} empresaId=${event.payload.empresaId}`,
  )
})

// Handler for PRODUCTO_ACTUALIZADO
eventBus.on<ProductoActualizadoPayload>("PRODUCTO_ACTUALIZADO", "producto_actualizado_sync_pos", async (event) => {
  await safeInvalidateCache(event.payload.empresaId)
  await syncPOSCatalog(event.payload.productoId, "update", event.payload)
  console.info(
    `[EVENT] PRODUCTO_ACTUALIZADO -> productoId=${event.payload.productoId} empresaId=${event.payload.empresaId}`,
  )
})

// Handler for PRODUCTO_ELIMINADO
eventBus.on<ProductoEliminadoPayload>("PRODUCTO_ELIMINADO", "producto_eliminado_sync_pos", async (event) => {
  await safeInvalidateCache(event.payload.empresaId)
  await syncPOSCatalog(event.payload.productoId, "delete", event.payload)
  console.info(
    `[EVENT] PRODUCTO_ELIMINADO -> productoId=${event.payload.productoId} empresaId=${event.payload.empresaId}`,
  )
})
