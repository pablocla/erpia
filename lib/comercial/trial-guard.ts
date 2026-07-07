import { getTrialStatus } from "./trial-service"
import { prisma } from "@/lib/prisma"
import { isEmpresaWriteBlocked } from "@/lib/comercial/comercial-access-service"

/**
 * Checks if the given empresa has an active trial (or no trial set).
 * Con ancla gratis, el trial empresa puede vencer sin bloquear el producto gratuito.
 */
export async function isTrialActive(empresaId: number): Promise<boolean> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { mpSubscriptionStatus: true },
  })

  if (empresa?.mpSubscriptionStatus === "authorized") return true

  const blocked = await isEmpresaWriteBlocked(empresaId)
  if (!blocked) return true

  const trial = await getTrialStatus(empresaId)
  if (!trial) return true

  return !trial.expirado
}

/**
 * Checks if the given empresa's trial has expired (bloqueo total sin ancla gratis).
 */
export async function isTrialExpired(empresaId: number): Promise<boolean> {
  const active = await isTrialActive(empresaId)
  return !active
}