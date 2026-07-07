/**
 * Embudo comercial híbrido — PLG (landing/demo) y SLG (relevamiento calle)
 * convergen en el mismo motor de activación pool-propiedad.
 */

import { prisma } from "@/lib/prisma"
import { activarPack } from "@/lib/platform/product-lifecycle"
import { persistSistemaLog } from "@/lib/ops/sistema-log"
import {
  landingPathParaModoLite,
  skusParaActivar,
} from "@/lib/comercial/pack-calle-catalog"
import { iniciarOnboardingPropiedad } from "@/lib/comercial/propiedad-onboarding"

export const PACK_PROPIEDAD = "pool-propiedad" as const

export type EmbudoOrigen = "plg" | "slg" | "demo" | "relevamiento" | "provision_orden"

export interface HybridProvisionResult {
  packId: string
  skus: string[]
  landingPath: string
  onboardingIniciado: boolean
}

export function esPackPropiedad(engancheOrSku: string | null | undefined): boolean {
  return engancheOrSku === PACK_PROPIEDAD
}

/** Activa pack + modoLite niche + checklist onboarding (sin seeds — Gemini). */
export async function provisionarPoolPropiedad(
  empresaId: number,
  origen: EmbudoOrigen,
): Promise<HybridProvisionResult> {
  await activarPack(empresaId, PACK_PROPIEDAD, origen)

  await prisma.empresa.update({
    where: { id: empresaId },
    data: {
      modoLite: "niche",
      rubro: "inmobiliaria",
    },
  })

  await iniciarOnboardingPropiedad(empresaId, origen)

  await persistSistemaLog({
    empresaId,
    severidad: "info",
    categoria: "comercial",
    contexto: "hybrid-provision",
    mensaje: `Pool Propiedad activado vía embudo ${origen}`,
    metadata: {
      packId: PACK_PROPIEDAD,
      origen,
      landingPath: "/dashboard/nicho/consorcios",
      href: "/dashboard/nicho/consorcios",
    },
  })

  return {
    packId: PACK_PROPIEDAD,
    skus: skusParaActivar(PACK_PROPIEDAD),
    landingPath: landingPathParaModoLite("niche"),
    onboardingIniciado: true,
  }
}