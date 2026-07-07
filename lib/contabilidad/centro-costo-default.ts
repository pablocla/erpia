/**
 * Resuelve centro de costo por defecto para asientos automáticos (Sprint B5).
 */

import { prisma } from "@/lib/prisma"

const cache = new Map<number, { id: number | null; expiresAt: number }>()
const TTL_MS = 60_000

export async function resolverCentroCostoDefault(empresaId: number): Promise<number | null> {
  const cached = cache.get(empresaId)
  if (cached && Date.now() < cached.expiresAt) return cached.id

  const primero = await prisma.centroCosto.findFirst({
    where: { empresaId, activo: true },
    orderBy: { codigo: "asc" },
    select: { id: true },
  })

  const id = primero?.id ?? null
  cache.set(empresaId, { id, expiresAt: Date.now() + TTL_MS })
  return id
}

export function limpiarCacheCentroCostoDefault(empresaId?: number): void {
  if (empresaId != null) cache.delete(empresaId)
  else cache.clear()
}