/**
 * Store de presencia multi-dispositivo (tenant-scoped).
 * En proceso: Map en memoria con TTL.
 * Suficiente para multi-terminal en la misma instancia; el heartbeat
 * del cliente compensa reinicios y rebalanceos de serverless.
 */

export interface PresencePeer {
  userId: string
  nombre: string
  avatarUrl?: string
  lastActive: string
  isEditing?: boolean
  resourceType: string
  resourceId: string
  empresaId: number
}

const STALE_MS = 30_000
const globalKey = "__claver_presence_store__"

type Store = Map<string, PresencePeer>

function getStore(): Store {
  const g = globalThis as typeof globalThis & { [globalKey]?: Store }
  if (!g[globalKey]) g[globalKey] = new Map()
  return g[globalKey]!
}

function peerKey(empresaId: number, resourceType: string, resourceId: string, userId: string) {
  return `${empresaId}:${resourceType}:${resourceId}:${userId}`
}

function roomPrefix(empresaId: number, resourceType: string, resourceId: string) {
  return `${empresaId}:${resourceType}:${resourceId}:`
}

function isFresh(peer: PresencePeer, now = Date.now()): boolean {
  const t = Date.parse(peer.lastActive)
  return Number.isFinite(t) && now - t < STALE_MS
}

export function upsertPresence(peer: PresencePeer): void {
  const store = getStore()
  store.set(
    peerKey(peer.empresaId, peer.resourceType, peer.resourceId, peer.userId),
    { ...peer, lastActive: peer.lastActive || new Date().toISOString() },
  )
}

export function leavePresence(input: {
  empresaId: number
  resourceType: string
  resourceId: string
  userId: string
}): void {
  getStore().delete(
    peerKey(input.empresaId, input.resourceType, input.resourceId, input.userId),
  )
}

export function listPresence(input: {
  empresaId: number
  resourceType: string
  resourceId: string
  excludeUserId?: string
}): PresencePeer[] {
  const store = getStore()
  const prefix = roomPrefix(input.empresaId, input.resourceType, input.resourceId)
  const now = Date.now()
  const peers: PresencePeer[] = []

  for (const [key, peer] of store.entries()) {
    if (!key.startsWith(prefix)) continue
    if (!isFresh(peer, now)) {
      store.delete(key)
      continue
    }
    if (input.excludeUserId && peer.userId === input.excludeUserId) continue
    peers.push(peer)
  }

  return peers.sort((a, b) => a.nombre.localeCompare(b.nombre, "es-AR"))
}
