"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuthStore } from "@/lib/stores/auth-store"

export interface ActiveUserPresence {
  userId: string
  nombre: string
  avatarUrl?: string
  lastActive: string
  isEditing?: boolean
}

const HEARTBEAT_MS = 8_000
const STALE_MS = 25_000

/**
 * Presencia en tiempo real (Shopify-style) sobre un recurso (Pedido, OT, Cotización).
 * Canal: BroadcastChannel `presence:{type}:{id}` + heartbeat.
 * Soft lock: si otro usuario tiene isEditing, isLockedByOther = true.
 */
export function usePresence(resourceType: string, resourceId?: string | null) {
  const user = useAuthStore((s) => s.user)
  const [activeUsers, setActiveUsers] = useState<ActiveUserPresence[]>([])
  const [isEditing, setIsEditing] = useState(false)

  const pruneStale = useCallback((list: ActiveUserPresence[]) => {
    const now = Date.now()
    return list.filter((u) => {
      const t = Date.parse(u.lastActive)
      return Number.isFinite(t) && now - t < STALE_MS
    })
  }, [])

  useEffect(() => {
    if (!resourceId || !user?.id) return

    const channelName = `presence:${resourceType}:${resourceId}`
    let channel: BroadcastChannel | null = null
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null
    let pruneTimer: ReturnType<typeof setInterval> | null = null

    const buildPresence = (): ActiveUserPresence => ({
      userId: user.id,
      nombre: user.nombre ?? "Usuario",
      avatarUrl: user.avatarUrl ?? undefined,
      lastActive: new Date().toISOString(),
      isEditing,
    })

    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel(channelName)

        const broadcast = (type: string) => {
          channel?.postMessage({ type, presence: buildPresence() })
        }

        broadcast("PRESENCE_JOIN")

        channel.onmessage = (event) => {
          const { type, presence } = event.data ?? {}
          if (!presence?.userId || presence.userId === user.id) return

          if (type === "PRESENCE_JOIN" || type === "PRESENCE_HEARTBEAT" || type === "PRESENCE_EDITING") {
            setActiveUsers((prev) => {
              const filtered = prev.filter((u) => u.userId !== presence.userId)
              return pruneStale([...filtered, presence as ActiveUserPresence])
            })
            // Responder al join para que el recién llegado nos vea
            if (type === "PRESENCE_JOIN") {
              broadcast("PRESENCE_HEARTBEAT")
            }
          } else if (type === "PRESENCE_LEAVE") {
            setActiveUsers((prev) => prev.filter((u) => u.userId !== presence.userId))
          }
        }

        heartbeatTimer = setInterval(() => broadcast("PRESENCE_HEARTBEAT"), HEARTBEAT_MS)
        pruneTimer = setInterval(() => {
          setActiveUsers((prev) => pruneStale(prev))
        }, HEARTBEAT_MS)
      }
    } catch {
      /* Fallback en entornos donde BroadcastChannel no está disponible */
    }

    return () => {
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      if (pruneTimer) clearInterval(pruneTimer)
      if (channel && user?.id) {
        try {
          channel.postMessage({
            type: "PRESENCE_LEAVE",
            presence: { userId: user.id },
          })
          channel.close()
        } catch {
          /* ignore */
        }
      }
    }
  }, [resourceType, resourceId, user?.id, user?.nombre, user?.avatarUrl, isEditing, pruneStale])

  // Notificar cambio de modo edición
  useEffect(() => {
    if (!resourceId || !user?.id) return
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return
    try {
      const channel = new BroadcastChannel(`presence:${resourceType}:${resourceId}`)
      channel.postMessage({
        type: "PRESENCE_EDITING",
        presence: {
          userId: user.id,
          nombre: user.nombre ?? "Usuario",
          avatarUrl: user.avatarUrl ?? undefined,
          lastActive: new Date().toISOString(),
          isEditing,
        },
      })
      channel.close()
    } catch {
      /* ignore */
    }
  }, [isEditing, resourceType, resourceId, user?.id, user?.nombre, user?.avatarUrl])

  const lockedBy = useMemo(() => {
    return activeUsers.find((u) => u.isEditing) ?? null
  }, [activeUsers])

  return {
    activeUsers,
    isEditing,
    setIsEditing,
    otherActiveCount: activeUsers.length,
    isLockedByOther: Boolean(lockedBy) && !isEditing,
    lockedBy,
  }
}

/** Alias del megaprompt */
export const useResourcePresence = usePresence
