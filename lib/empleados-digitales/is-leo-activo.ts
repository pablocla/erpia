/**
 * Helper: ¿hay instancia Leo runnable en la empresa?
 * Usado para no duplicar cobranzas (ED-07).
 */

import { prisma } from "@/lib/prisma"
import { LEO_COBRANZA_CODE, LEO_COBRANZA_SKU, LEO_LEGACY_SKU } from "./types"

export async function isLeoActivo(empresaId: number): Promise<boolean> {
  if (!empresaId || empresaId <= 0) return false

  const emp = await prisma.empleadoDigital.findFirst({
    where: {
      empresaId,
      estado: { in: ["activo", "trial"] },
      OR: [
        { sku: { in: [LEO_COBRANZA_SKU, LEO_LEGACY_SKU] } },
        { template: { code: LEO_COBRANZA_CODE } },
      ],
    },
    select: { id: true },
  })

  return Boolean(emp)
}
