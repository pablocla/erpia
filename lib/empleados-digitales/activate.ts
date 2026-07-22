/**
 * Activación / desactivación de Leo vía SKU (product-lifecycle hooks)
 */

import { prisma } from "@/lib/prisma"
import { getTemplateByCode, getTemplateBySku } from "./catalog/templates"
import {
  DEFAULT_LEO_CONFIG,
  LEO_COBRANZA_CODE,
  LEO_COBRANZA_SKU,
  LEO_LEGACY_SKU,
} from "./types"

async function ensureTemplateRow(code: string) {
  const def = getTemplateByCode(code)
  if (!def) throw new Error(`Template ${code} no definido`)

  const existing = await prisma.empleadoDigitalTemplate.findUnique({
    where: { code: def.code },
  })
  if (existing) return existing

  return prisma.empleadoDigitalTemplate.create({
    data: {
      code: def.code,
      nombre: def.nombre,
      lema: def.lema,
      descripcion: def.descripcion,
      categoria: def.categoria,
      icono: def.icono,
      sku: def.sku,
      dependeDe: def.dependeDe,
      tools: def.tools,
      playbookKeys: def.playbookKeys,
      llmAgentId: def.llmAgentId,
      cronDefault: def.cronDefault,
      politicaDefault: def.politicaDefault as object,
      activoCatalogo: true,
    },
  })
}

/** Activa instancia Leo para la empresa (idempotente) */
export async function activarLeoCobranza(empresaId: number, opts?: { trial?: boolean }) {
  const template = await ensureTemplateRow(LEO_COBRANZA_CODE)
  const def = getTemplateByCode(LEO_COBRANZA_CODE)!

  const existing = await prisma.empleadoDigital.findUnique({
    where: {
      empresaId_sku: { empresaId, sku: LEO_COBRANZA_SKU },
    },
  })

  if (existing) {
    return prisma.empleadoDigital.update({
      where: { id: existing.id },
      data: {
        estado: opts?.trial ? "trial" : "activo",
        activatedAt: existing.activatedAt ?? new Date(),
        templateId: template.id,
      },
      include: { template: true },
    })
  }

  return prisma.empleadoDigital.create({
    data: {
      empresaId,
      templateId: template.id,
      nombre: def.nombre,
      estado: opts?.trial ? "trial" : "activo",
      sku: LEO_COBRANZA_SKU,
      cron: def.cronDefault,
      config: DEFAULT_LEO_CONFIG as object,
      activatedAt: new Date(),
    },
    include: { template: true },
  })
}

export async function desactivarLeoCobranza(empresaId: number) {
  await prisma.empleadoDigital.updateMany({
    where: {
      empresaId,
      sku: { in: [LEO_COBRANZA_SKU, LEO_LEGACY_SKU] },
    },
    data: { estado: "pausado" },
  })
  return { ok: true }
}

export async function pausarOReanudar(
  empresaId: number,
  code: string,
  estado: "activo" | "pausado",
) {
  const emp = await prisma.empleadoDigital.findFirst({
    where: { empresaId, template: { code } },
  })
  if (!emp) throw new Error("Empleado no encontrado")
  return prisma.empleadoDigital.update({
    where: { id: emp.id },
    data: { estado },
  })
}

/** SKUs que disparan activación de Leo */
export function isLeoSku(sku: string): boolean {
  return sku === LEO_COBRANZA_SKU || sku === LEO_LEGACY_SKU || !!getTemplateBySku(sku)
}
