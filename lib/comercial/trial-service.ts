// @ts-nocheck
/**
 * Trial comercial — countdown y conversión (auditoría F1-1).
 * Persiste en ParametroFiscal sin migración de schema.
 */

import { prisma } from "@/lib/prisma"

const TRIAL_CLAVE = "trial_expires_at"
const TRIAL_PAIS = "AR"

export type TrialStatus = {
  activo: boolean
  expiresAt: string
  diasRestantes: number
  trialDias: number
  expirado: boolean
}

export async function setTrialExpiresAt(
  empresaId: number,
  expiresAt: Date,
  trialDias = 14,
): Promise<void> {
  await prisma.parametroFiscal.upsert({
    where: {
      empresaId_clave_pais: { empresaId, clave: TRIAL_CLAVE, pais: TRIAL_PAIS },
    },
    update: {
      valor: trialDias,
      descripcion: expiresAt.toISOString(),
    },
    create: {
      empresaId,
      clave: TRIAL_CLAVE,
      valor: trialDias,
      descripcion: expiresAt.toISOString(),
      categoria: "comercial",
      pais: TRIAL_PAIS,
    },
  })
}

export async function getTrialStatus(empresaId: number): Promise<TrialStatus | null> {
  const row = await prisma.parametroFiscal.findUnique({
    where: {
      empresaId_clave_pais: { empresaId, clave: TRIAL_CLAVE, pais: TRIAL_PAIS },
    },
    select: { descripcion: true, valor: true },
  })

  if (!row?.descripcion) return null

  const expiresAt = new Date(row.descripcion)
  if (Number.isNaN(expiresAt.getTime())) return null

  const msRestantes = expiresAt.getTime() - Date.now()
  const diasRestantes = Math.max(0, Math.ceil(msRestantes / (24 * 60 * 60 * 1000)))

  return {
    activo: msRestantes > 0,
    expiresAt: expiresAt.toISOString(),
    diasRestantes,
    trialDias: row.valor ?? 14,
    expirado: msRestantes <= 0,
  }
}

export function formatTrialCountdown(diasRestantes: number): string {
  if (diasRestantes <= 0) return "Trial vencido"
  if (diasRestantes === 1) return "1 día restante"
  return `${diasRestantes} días restantes`
}