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

/** Activa instancia Leo para la empresa (idempotente). Default trial para poder probar ya. */
export async function activarLeoCobranza(empresaId: number, opts?: { trial?: boolean }) {
  const trial = opts?.trial !== false // default true
  const template = await ensureTemplateRow(LEO_COBRANZA_CODE)
  const def = getTemplateByCode(LEO_COBRANZA_CODE)!

  // Soft-deps: WhatsApp SKUs + flag notificaciones (no bloquea si falla)
  try {
    const { ensureLeoRuntimeDeps } = await import("./ensure-deps")
    await ensureLeoRuntimeDeps(empresaId)
  } catch (err) {
    console.warn("[Leo] ensure deps:", err)
  }

  const existing = await prisma.empleadoDigital.findUnique({
    where: {
      empresaId_sku: { empresaId, sku: LEO_COBRANZA_SKU },
    },
  })

  if (existing) {
    const updated = await prisma.empleadoDigital.update({
      where: { id: existing.id },
      data: {
        estado: trial ? "trial" : "activo",
        activatedAt: existing.activatedAt ?? new Date(),
        templateId: template.id,
      },
      include: { template: true },
    })
    void seedScrumOnboardingLeo(empresaId).catch(() => {})
    void maybeSetModoLiteLeo(empresaId).catch(() => {})
    return updated
  }

  const created = await prisma.empleadoDigital.create({
    data: {
      empresaId,
      templateId: template.id,
      nombre: def.nombre,
      estado: trial ? "trial" : "activo",
      sku: LEO_COBRANZA_SKU,
      cron: def.cronDefault,
      config: DEFAULT_LEO_CONFIG as object,
      activatedAt: new Date(),
    },
    include: { template: true },
  })
  void seedScrumOnboardingLeo(empresaId).catch(() => {})
  void maybeSetModoLiteLeo(empresaId).catch(() => {})
  return created
}

/** IMP-02: ítems scrum si hay proyecto de implementación Cloud */
async function seedScrumOnboardingLeo(empresaId: number) {
  try {
    const { crearBacklogItem } = await import("@/lib/ops/scrum-service")
    const items = [
      { titulo: "Leo: configurar WhatsApp / Twilio", tipo: "marketplace_sku" as const },
      { titulo: "Leo: cargar teléfonos de deudores", tipo: "marketplace_sku" as const },
      { titulo: "Leo: prueba dry-run + 1 approve", tipo: "marketplace_sku" as const },
      { titulo: "Leo: link Mercado Pago (opcional)", tipo: "marketplace_sku" as const },
    ]
    for (const it of items) {
      await crearBacklogItem(
        empresaId,
        {
          tipo: it.tipo,
          titulo: it.titulo,
          descripcion: "Checklist activación Leo Cobranza",
          visibilidadCliente: true,
          vinculoRef: "empleado.leo_cobranza",
        },
        "system-leo-activate",
      )
    }
  } catch {
    /* sin proyecto implementación = ok */
  }
}

/** ED-17: si el comercio está en modo cobranza/fiado o vacío, empujar landing Leo */
async function maybeSetModoLiteLeo(empresaId: number) {
  try {
    const e = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { modoLite: true },
    })
    if (!e) return
    if (e.modoLite === "completo" || e.modoLite === "pos" || e.modoLite === "niche") return
    // cobranza / fiado / null → leo shell
    await prisma.empresa.update({
      where: { id: empresaId },
      data: { modoLite: "leo" },
    })
  } catch {
    /* ignore */
  }
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

/** SKUs que disparan activación de Leo (no el roster completo). */
export function isLeoSku(sku: string): boolean {
  return sku === LEO_COBRANZA_SKU || sku === LEO_LEGACY_SKU
}

/** Activa cualquier template del catálogo (Sofía, Ramiro, Ana…). Idempotente. */
export async function activarEmpleadoDesdeTemplate(
  empresaId: number,
  code: string,
  opts?: { trial?: boolean },
) {
  if (code === LEO_COBRANZA_CODE) {
    return activarLeoCobranza(empresaId, opts)
  }
  const trial = opts?.trial !== false
  const def = getTemplateByCode(code)
  if (!def) throw new Error(`Template ${code} no definido`)
  const template = await ensureTemplateRow(code)

  const existing = await prisma.empleadoDigital.findUnique({
    where: { empresaId_sku: { empresaId, sku: def.sku } },
  })
  if (existing) {
    return prisma.empleadoDigital.update({
      where: { id: existing.id },
      data: {
        estado: trial ? "trial" : "activo",
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
      estado: trial ? "trial" : "activo",
      sku: def.sku,
      cron: def.cronDefault,
      config: def.politicaDefault as object,
      activatedAt: new Date(),
    },
    include: { template: true },
  })
}

export async function desactivarEmpleadoPorSku(empresaId: number, sku: string) {
  await prisma.empleadoDigital.updateMany({
    where: { empresaId, sku },
    data: { estado: "pausado" },
  })
  return { ok: true }
}
