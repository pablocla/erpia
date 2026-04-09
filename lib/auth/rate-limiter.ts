/**
 * In-memory rate limiter — Sprint 15
 * Lightweight per-IP sliding-window counter.
 * For production at scale, replace with Redis (e.g. ioredis + sliding window).
 */
import { type NextRequest, NextResponse } from "next/server"

interface RateLimitEntry {
  count: number
  resetAt: number
}

const stores = new Map<string, Map<string, RateLimitEntry>>()

// Periodic cleanup to prevent memory leak (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [, store] of stores) {
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key)
    }
  }
}, 5 * 60 * 1000).unref?.()

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

/**
 * Check rate limit for the given request.
 * Returns null if allowed, or a 429 NextResponse if blocked.
 */
export function checkRateLimit(
  request: NextRequest,
  /** Unique namespace for this limiter (e.g. "login", "demo") */
  namespace: string,
  /** Max requests per window (default: 5) */
  maxAttempts = 5,
  /** Window duration in ms (default: 15 min) */
  windowMs = 15 * 60 * 1000,
): NextResponse | null {
  if (!stores.has(namespace)) stores.set(namespace, new Map())
  const store = stores.get(namespace)!
  const ip = getClientIp(request)
  const now = Date.now()

  const entry = store.get(ip)
  if (entry) {
    if (now < entry.resetAt) {
      if (entry.count >= maxAttempts) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
        return NextResponse.json(
          { error: "Demasiados intentos. Intente nuevamente más tarde." },
          { status: 429, headers: { "Retry-After": String(retryAfter) } },
        )
      }
      entry.count++
    } else {
      store.set(ip, { count: 1, resetAt: now + windowMs })
    }
  } else {
    store.set(ip, { count: 1, resetAt: now + windowMs })
  }

  return null
}
