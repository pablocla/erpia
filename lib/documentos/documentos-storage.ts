/**
 * Cliente server-side para Supabase Storage (bucket de adjuntos GED).
 * Usa service role — nunca importar en componentes cliente.
 */

import { createClient } from "@supabase/supabase-js"

export const DOCS_STORAGE_BUCKET = process.env.SUPABASE_DOCS_BUCKET ?? "docs"

function getStorageAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return null
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Elimina uno o más objetos del bucket de documentos. */
export async function eliminarArchivosStorage(storageKeys: string[]): Promise<void> {
  const keys = storageKeys.map((k) => k.trim()).filter(Boolean)
  if (keys.length === 0) return

  const client = getStorageAdminClient()
  if (!client) {
    console.warn(
      "[documentos-storage] SUPABASE_SERVICE_ROLE_KEY no configurada — archivos no eliminados del bucket:",
      keys,
    )
    return
  }

  const { error } = await client.storage.from(DOCS_STORAGE_BUCKET).remove(keys)
  if (error) {
    throw new Error(`No se pudo eliminar del storage: ${error.message}`)
  }
}

export async function eliminarArchivoStorage(storageKey: string): Promise<void> {
  await eliminarArchivosStorage([storageKey])
}