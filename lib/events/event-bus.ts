/**
 * Event Bus — Core Engine
 *
 * In-process event bus that routes domain events to registered handlers.
 * Checks ConfiguracionFuncional in DB to decide which handlers are active.
 * Logs every execution to HandlerLog for audit trail.
 *
 * Usage:
 *   import { eventBus } from "@/lib/events/event-bus"
 *   eventBus.emit({ type: "FACTURA_EMITIDA", payload: { facturaId: 1, ... }, timestamp: new Date() })
 */

import { prisma } from "@/lib/prisma"
import type { ERPEvent, ERPEventType, EventHandler } from "./types"

interface HandlerRegistration {
  handlerName: string
  evento: ERPEventType
  fn: EventHandler<any>
}

class EventBus {
  private handlers: HandlerRegistration[] = []
  private configCache: Map<string, boolean> | null = null
  private cacheExpiry = 0

  /**
   * Register a handler. The handlerName must match ConfiguracionFuncional.handler.
   */
  on<T>(evento: ERPEventType, handlerName: string, fn: EventHandler<T>) {
    this.handlers.push({ handlerName, evento, fn })
  }

  off(handlerName: string) {
    this.handlers = this.handlers.filter((h) => h.handlerName !== handlerName)
  }

  /**
   * Emit an event. Each matching handler is executed in sequence.
   * Disabled handlers (ConfiguracionFuncional.activo = false) are skipped.
   * Errors in one handler don't block the rest.
   */
  async emit<T>(event: ERPEvent<T>): Promise<void> {
    const activeMap = await this.getActiveHandlers()
    const matching = this.handlers.filter((h) => h.evento === event.type)

    for (const registration of matching) {
      const isActive = activeMap.get(registration.handlerName)
      // If no DB config exists, handler runs by default
      if (isActive === false) {
        continue
      }

      const start = Date.now()
      let exito = true
      let errorMsg: string | null = null

      try {
        await registration.fn(event)
      } catch (err) {
        exito = false
        errorMsg = err instanceof Error ? err.message : String(err)
        console.error(`[EventBus] Error in handler "${registration.handlerName}":`, errorMsg)
      }

      // Fire-and-forget log — don't block the event pipeline
      this.log(event, registration.handlerName, exito, Date.now() - start, errorMsg).catch(() => {})
    }
  }

  /**
   * Load ConfiguracionFuncional from DB. Caches for 60 seconds.
   */
  private async getActiveHandlers(): Promise<Map<string, boolean>> {
    const now = Date.now()
    if (this.configCache && now < this.cacheExpiry) {
      return this.configCache
    }

    try {
      const configs = await prisma.configuracionFuncional.findMany({
        select: { handler: true, activo: true },
      })
      const map = new Map<string, boolean>()
      for (const c of configs) {
        map.set(c.handler, c.activo)
      }
      this.configCache = map
      this.cacheExpiry = now + 60_000
      return map
    } catch {
      // If DB is unreachable, allow all handlers
      return this.configCache ?? new Map()
    }
  }

  private async log(
    event: ERPEvent<any>,
    handler: string,
    exito: boolean,
    duracionMs: number,
    errorMsg: string | null,
  ) {
    try {
      const config = await prisma.configuracionFuncional.findUnique({
        where: { handler },
        select: { id: true },
      })

      await prisma.handlerLog.create({
        data: {
          evento: event.type,
          handler,
          exito,
          duracionMs,
          payload: JSON.stringify(event.payload),
          errorMsg,
          configId: config?.id ?? null,
        },
      })
    } catch {
      // Logging failure is not fatal
    }
  }

  /** Force-refresh the config cache on next emit */
  invalidateCache() {
    this.configCache = null
    this.cacheExpiry = 0
  }
}

export const eventBus = new EventBus()
