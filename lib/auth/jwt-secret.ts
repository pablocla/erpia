/**
 * JWT secret centralizado — fail-closed en production.
 * Evita el fallback "dev-...-unsafe" fuera de desarrollo.
 */

const DEV_FALLBACK = "dev-pos-system-argentina-2025-unsafe"

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === "production"
}

/**
 * Secret crudo o null si falta.
 * En production nunca devuelve el fallback de desarrollo.
 */
export function getJwtSecretRaw(): string | null {
  const secret = process.env.JWT_SECRET?.trim()
  if (secret) return secret
  if (isProductionEnv()) return null
  return DEV_FALLBACK
}

/** Uint8Array para jose SignJWT / jwtVerify. Lanza en production sin JWT_SECRET. */
export function getEncodedJwtSecret(): Uint8Array {
  const secret = getJwtSecretRaw()
  if (!secret) {
    throw new Error("JWT_SECRET no está configurado. Defínelo en las variables de entorno.")
  }
  return new TextEncoder().encode(secret)
}

/** true si hay secret usable (env o fallback dev). */
export function hasJwtSecretConfigured(): boolean {
  return Boolean(process.env.JWT_SECRET?.trim()) || !isProductionEnv()
}
