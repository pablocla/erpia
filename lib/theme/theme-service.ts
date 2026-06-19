import { prisma } from "@/lib/prisma"
import { mergeTemaConfig, type EmpresaTemaConfig } from "./types"

export async function getEmpresaTema(empresaId: number): Promise<EmpresaTemaConfig> {
  const rows = await prisma.$queryRaw<Array<{ temaConfig: unknown }>>`
    SELECT "temaConfig" FROM empresas WHERE id = ${empresaId} LIMIT 1
  `
  return mergeTemaConfig(rows[0]?.temaConfig as Partial<EmpresaTemaConfig> | null)
}

export async function updateEmpresaTema(
  empresaId: number,
  partial: Partial<EmpresaTemaConfig>
): Promise<EmpresaTemaConfig> {
  const current = await getEmpresaTema(empresaId)
  const next = mergeTemaConfig({ ...current, ...partial })
  await prisma.$executeRaw`
    UPDATE empresas SET "temaConfig" = ${JSON.stringify(next)}::jsonb, "updatedAt" = NOW()
    WHERE id = ${empresaId}
  `
  return next
}