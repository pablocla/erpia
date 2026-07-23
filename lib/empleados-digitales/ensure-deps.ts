/**
 * Dependencias blandas al activar Leo (trial-friendly).
 */

import { prisma } from "@/lib/prisma"

const WHATSAPP_SKUS = ["com.whatsapp", "channel.whatsapp"] as const

export async function ensureLeoRuntimeDeps(empresaId: number) {
  for (const sku of WHATSAPP_SKUS) {
    await prisma.suscripcionModulo.upsert({
      where: { empresaId_sku: { empresaId, sku } },
      update: { activo: true },
      create: {
        empresaId,
        sku,
        activo: true,
        vigenciaHasta: null,
      },
    })
  }

  await prisma.empresa.update({
    where: { id: empresaId },
    data: { fiadoNotificarWhatsApp: true },
  })

  return { ok: true as const, skus: [...WHATSAPP_SKUS] }
}
