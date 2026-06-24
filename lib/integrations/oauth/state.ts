import { createHmac, timingSafeEqual } from "crypto"

export interface OAuthStatePayload {
  empresaId: number
  integracionId: string
  userId: number
  returnPath: string
  exp: number
}

function oauthSecret(): string {
  return process.env.INTEGRATION_ENCRYPTION_KEY
    ?? process.env.JWT_SECRET
    ?? "claverp-dev-oauth-state"
}

export function createOAuthState(
  payload: Omit<OAuthStatePayload, "exp"> & { ttlSec?: number },
): string {
  const exp = Date.now() + (payload.ttlSec ?? 600) * 1000
  const data: OAuthStatePayload = {
    empresaId: payload.empresaId,
    integracionId: payload.integracionId,
    userId: payload.userId,
    returnPath: payload.returnPath,
    exp,
  }
  const json = Buffer.from(JSON.stringify(data)).toString("base64url")
  const sig = createHmac("sha256", oauthSecret()).update(json).digest("base64url")
  return `${json}.${sig}`
}

export function verifyOAuthState(token: string): OAuthStatePayload | null {
  const dot = token.lastIndexOf(".")
  if (dot <= 0) return null
  const json = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expected = createHmac("sha256", oauthSecret()).update(json).digest("base64url")
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  try {
    const data = JSON.parse(Buffer.from(json, "base64url").toString()) as OAuthStatePayload
    if (data.exp < Date.now()) return null
    return data
  } catch {
    return null
  }
}