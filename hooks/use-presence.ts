"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuthStore, getToken, authFetch } from "@/lib/stores"

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
 * Presencia multi-dispositivo (Shopify-style) sobre un recurso.
 *
 * Capas:
 *  1. API servidor `/api/presence` — multi-terminal / multi-PC (mismo tenant)
 *  2. BroadcastChannel — pestañas locales (latencia baja)
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

  const mergePeers = useCallback(
    (incoming: ActiveUserPresence[]) => {
      setActiveUsers((prev) => {
        const map = new Map<string, ActiveUserPresence>()
        for (const u of prev) map.set(u.userId, u)
        for (const u of incoming) {
          if (u.userId === String(user?.id)) continue
          map.set(u.userId, u)
        }
        return pruneStale([...map.values()])
      })
    },
    [pruneStale, user?.id],
  )

  useEffect(() => {
    if (!resourceId || !user?.id) return

    const channelName = `presence:${resourceType}:${resourceId}`
    let channel: BroadcastChannel | null = null
    let heartbeatTimer: ReturnType<typeof setInterval> | null = null
    let pruneTimer: ReturnType<typeof setInterval> | null = null
    let aborted = false

    const buildPresence = (): ActiveUserPresence => ({
      userId: String(user.id),
      nombre: user.nombre ?? "Usuario",
      avatarUrl: user.avatarUrl ?? undefined,
      lastActive: new Date().toISOString(),
      isEditing,
    })

    const postServer = async (action: "heartbeat" | "leave") => {
      if (!getToken()) return
      try {
        if (action === "leave") {
          await authFetch("/api/presence", {
            method: "POST",
            body: JSON.stringify({
              action: "leave",
              resourceType,
              resourceId,
            }),
          })
          return
        }
        const res = await authFetch("/api/presence", {
          method: "POST",
          body: JSON.stringify({
            action: "heartbeat",
            resourceType,
            resourceId,
            isEditing,
            nombre: user.nombre ?? "Usuario",
            avatarUrl: user.avatarUrl ?? null,
          }),
        })
        if (res.ok && !aborted) {
          const json = await res.json()
          if (Array.isArray(json.peers)) {
            mergePeers(json.peers as ActiveUserPresence[])
          }
        }
      } catch {
        /* red caída: BroadcastChannel local sigue activo */
      }
    }

    // ── BroadcastChannel (misma máquina / pestañas) ──
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel(channelName)

        const broadcast = (type: string) => {
          channel?.postMessage({ type, presence: buildPresence() })
        }

        broadcast("PRESENCE_JOIN")

        channel.onmessage = (event) => {
          const { type, presence } = event.data ?? {}
          if (!presence?.userId || presence.userId === String(user.id)) return

          if (
            type === "PRESENCE_JOIN" ||
            type === "PRESENCE_HEARTBEAT" ||
            type === "PRESENCE_EDITING"
          ) {
            setActiveUsers((prev) => {
              const filtered = prev.filter((u) => u.userId !== presence.userId)
              return pruneStale([...filtered, presence as ActiveUserPresence])
            })
            if (type === "PRESENCE_JOIN") {
              broadcast("PRESENCE_HEARTBEAT")
            }
          } else if (type === "PRESENCE_LEAVE") {
            setActiveUsers((prev) => prev.filter((u) => u.userId !== presence.userId))
          }
        }

        heartbeatTimer = setInterval(() => {
          broadcast("PRESENCE_HEARTBEAT")
          void postServer("heartbeat")
        }, HEARTBEAT_MS)

        pruneTimer = setInterval(() => {
          setActiveUsers((prev) => pruneStale(prev))
        }, HEARTBEAT_MS)
      }
    } catch {
      /* entornos sin BroadcastChannel */
    }

    // Heartbeat servidor inmediato + periódico si no hay BC
    void postServer("heartbeat")
    if (!heartbeatTimer) {
      heartbeatTimer = setInterval(() => void postServer("heartbeat"), HEARTBEAT_MS)
    }

    return () => {
      aborted = true
      if (heartbeatTimer) clearInterval(heartbeatTimer)
      if (pruneTimer) clearInterval(pruneTimer)
      void postServer("leave")
      if (channel && user?.id) {
        try {
          channel.postMessage({
            type: "PRESENCE_LEAVE",
            presence: { userId: String(user.id) },
          })
          channel.close()
        } catch {
          /* ignore */
        }
      }
    }
  }, [
    resourceType,
    resourceId,
    user?.id,
    user?.nombre,
    user?.avatarUrl,
    isEditing,
    pruneStale,
    mergePeers,
  ])

  // Notificar cambio de modo edición en BroadcastChannel
  useEffect(() => {
    if (!resourceId || !user?.id) return
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return
    try {
      const channel = new BroadcastChannel(`presence:${resourceType}:${resourceId}`)
      channel.postMessage({
        type: "PRESENCE_EDITING",
        presence: {
          userId: String(user.id),
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
