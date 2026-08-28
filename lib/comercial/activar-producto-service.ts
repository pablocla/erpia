/**
 * Activación de producto desde ?activar= (landing → login o registro).
 */

import { prisma } from "@/lib/prisma"
import { resolveActivarIntent } from "@/lib/comercial/activar-intent"
import { applyRetailOnboarding } from "@/lib/comercial/retail-onboarding-service"
import { getTrialStatus, setTrialExpiresAt } from "@/lib/comercial/trial-service"
import { esAltaAnclaSinTrial, resolveOferta } from "@/lib/comercial/ofertas-comerciales"
import type { ApplyRetailOnboardingResult } from "@/lib/comercial/retail-onboarding-service"

export interface ApplyActivarIntentInput {
  empresaId: number
  activar: string
  origen?: string
}

export async function applyActivarIntent(
  input: ApplyActivarIntentInput,
): Promise<ApplyRetailOnboardingResult> {
  const intent = resolveActivarIntent(input.activar)
  if (!intent) {
    throw new Error("Producto de activación no reconocido")
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: input.empresaId },
    select: { rubro: true, modoLite: true },
  })
  if (!empresa) {
    throw new Error("Empresa no encontrada")
  }

  const onboardingPrevio = await prisma.parametroFiscal.findUnique({
    where: {
      empresaId_clave_pais: {
        empresaId: input.empresaId,
        clave: "onboarding_completado",
        pais: "AR",
      },
    },
  })

  const oferta = resolveOferta(intent.engancheId, intent.modoLite)
  const trialDias = esAltaAnclaSinTrial(oferta) ? 0 : (oferta.trialDias || 14)
  const trial = await getTrialStatus(input.empresaId)
  if (!trial && trialDias > 0) {
    const expires = new Date(Date.now() + trialDias * 24 * 60 * 60 * 1000)
    await setTrialExpiresAt(input.empresaId, expires, trialDias)
  }

  return applyRetailOnboarding({
    empresaId: input.empresaId,
    rubro: empresa.rubro ?? "otro",
    engancheId: intent.engancheId,
    modoLite: intent.modoLite,
    productos: [],
    trialDias,
    origen: input.origen ?? "activar_intent",
    skipSeed: Boolean(onboardingPrevio),
  })
}