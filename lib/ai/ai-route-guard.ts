/**
 * Guardias unificados para rutas /api/ai — rate limit, módulo IA y SKU core.ia.
 */

import { type NextRequest, NextResponse } from "next/server"
import type { AuthContext } from "@/lib/auth/empresa-guard"
import { checkRateLimit, checkRateLimitByKey } from "@/lib/auth/rate-limiter"
import { canWriteSku } from "@/lib/comercial/comercial-access-service"
import { isIAEnabled } from "./ia-guard"

export const AI_ENTITLEMENT_SKU = "core.ia"

export type AiRateTier = "chat" | "mutation" | "public" | "status"

const TIER_LIMITS: Record<AiRateTier, { max: number; windowMs: number }> = {
  chat: { max: Number(process.env.AI_RATE_LIMIT_CHAT ?? 30), windowMs: 60 * 60 * 1000 },
  mutation: { max: Number(process.env.AI_RATE_LIMIT_MUTATION ?? 60), windowMs: 60 * 60 * 1000 },
  public: { max: Number(process.env.AI_RATE_LIMIT_PUBLIC ?? 5), windowMs: 60 * 60 * 1000 },
  status: { max: Number(process.env.AI_RATE_LIMIT_STATUS ?? 120), windowMs: 60 * 60 * 1000 },
}

export type AiGuardOptions = {
  maxAttempts?: number
  windowMs?: number
  /** Onboarding u otros flujos sin SKU (solo rate limit) */
  skipEntitlement?: boolean
  skipModuleCheck?: boolean
}

function rateLimitEnabled(): boolean {
  return process.env.AI_RATE_LIMIT_ENABLED !== "false"
}

/**
 * Devuelve NextResponse si debe bloquearse; null si puede continuar.
 */
export async function guardAiRequest(
  request: NextRequest,
  auth: AuthContext | null,
  tier: AiRateTier = "mutation",
  options: AiGuardOptions = {},
): Promise<NextResponse | null> {
  if (rateLimitEnabled()) {
    const limits = TIER_LIMITS[tier]
    const max = options.maxAttempts ?? limits.max
    const windowMs = options.windowMs ?? limits.windowMs

    if (auth) {
      const blocked = checkRateLimitByKey(
        `empresa:${auth.empresaId}:user:${auth.userId}`,
        `ai:${tier}`,
        max,
        windowMs,
      )
      if (blocked) return blocked
    } else {
      const blocked = checkRateLimit(request, `ai:${tier}:public`, max, windowMs)
      if (blocked) return blocked
    }
  }

  if (options.skipEntitlement && options.skipModuleCheck) {
    return null
  }

  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  if (!options.skipModuleCheck) {
    if (!(await isIAEnabled(auth.empresaId))) {
      return NextResponse.json(
        { error: "Módulo IA no está habilitado para esta empresa", code: "IA_MODULE_DISABLED" },
        { status: 403 },
      )
    }
  }

  if (!options.skipEntitlement) {
    const puede = await canWriteSku(auth.empresaId, AI_ENTITLEMENT_SKU)
    if (!puede) {
      return NextResponse.json(
        {
          error: "Claver IA no está en tu plan. Activá el motor IA desde Mi plan o el marketplace.",
          code: "SKU_ENTITLEMENT_DENIED",
          skus: [AI_ENTITLEMENT_SKU],
        },
        { status: 402 },
      )
    }
  }

  return null
}

/** GET /api/ai/status — solo usuarios autenticados, sin consumo de tokens */
export async function guardAiStatusRequest(
  request: NextRequest,
  auth: AuthContext,
): Promise<NextResponse | null> {
  if (!rateLimitEnabled()) return null
  const limits = TIER_LIMITS.status
  return checkRateLimitByKey(
    `empresa:${auth.empresaId}`,
    "ai:status",
    limits.max,
    limits.windowMs,
  )
}