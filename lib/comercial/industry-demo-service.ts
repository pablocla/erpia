/**
 * Provisioning de demo hiper-segmentada por industria.
 */

import { prisma } from "@/lib/prisma"
import { parametrizarEmpresa } from "@/lib/config/parametrizacion-rubro"
import { applyRetailOnboarding } from "@/lib/comercial/retail-onboarding-service"
import {
  getIndustryTemplate,
  getGoldenPathForRubro,
  resolveIndustryEnganche,
  type IndustryTemplate,
} from "@/lib/comercial/industry-templates"
import { setIndustryModules } from "@/lib/comercial/industry-modules"
import { seedIndustryDemoData } from "@/lib/comercial/industry-demo-seeds"
import { normalizeRubroValue } from "@/lib/onboarding/onboarding-ia"
import { setTrialExpiresAt } from "@/lib/comercial/trial-service"
import { activarPack, activarProducto } from "@/lib/platform/product-lifecycle"
import { getPackHorizontal } from "@/lib/platform/product-registry"
import { getActiveSubscription } from "@/lib/platform/commercial-service"
import {
  inferModoLiteFromEnganche,
  resolvePackCalle,
  skusParaActivar,
  type ModoLite,
} from "@/lib/comercial/pack-calle-catalog"

export interface ProvisionIndustryDemoResult {
  industryId: string
  rubro: string
  goldenPath: string
  empresaNombre: string
  productosCreados: number
  clientesCreados: number
  skusActivados: string[]
  modoLite: string
}

export function resolveIndustryId(raw: string): IndustryTemplate | null {
  return getIndustryTemplate(raw) ?? getIndustryTemplate(normalizeRubroValue(raw))
}

async function applyIndustryEnganche(
  empresaId: number,
  engancheId: string,
  trialDias: number,
): Promise<{ skusActivados: string[]; modoLite: ModoLite }> {
  const pack = resolvePackCalle(engancheId)
  const modoLite = pack?.modoLite ?? inferModoLiteFromEnganche(engancheId)
  const trialExpiresAt = new Date(Date.now() + trialDias * 24 * 60 * 60 * 1000)
  const origen = "industry_demo"
  const activados: string[] = []

  await prisma.empresa.update({
    where: { id: empresaId },
    data: { modoLite },
  })

  if (pack?.tipo === "pack" && getPackHorizontal(engancheId)) {
    await activarPack(empresaId, engancheId, origen)
    activados.push(...pack.skus)
  } else {
    for (const sku of skusParaActivar(engancheId)) {
      try {
        await activarProducto(empresaId, sku, origen)
        activados.push(sku)
      } catch (err) {
        console.warn(`[industry-demo] No se pudo activar ${sku}:`, err)
      }
    }
  }

  const skusActivados = new Set(activados)
  for (const sku of skusParaActivar(engancheId)) {
    const sub = await getActiveSubscription(empresaId, sku)
    if (sub) skusActivados.add(sku)
  }
  const fiado = await getActiveSubscription(empresaId, "pos.fiado_barrio")
  if (fiado) skusActivados.add("pos.fiado_barrio")

  for (const sku of skusActivados) {
    await prisma.suscripcionModulo.upsert({
      where: { empresaId_sku: { empresaId, sku } },
      update: { activo: true, vigenciaHasta: trialExpiresAt },
      create: { empresaId, sku, activo: true, vigenciaHasta: trialExpiresAt },
    })
  }

  return { skusActivados: [...skusActivados], modoLite }
}

export async function provisionIndustryDemo(
  empresaId: number,
  industryId: string,
): Promise<ProvisionIndustryDemoResult> {
  const template = resolveIndustryId(industryId)
  if (!template) {
    throw new Error(`Industria no soportada: ${industryId}`)
  }

  const rubro = template.rubro
  const goldenPath = template.goldenPath ?? getGoldenPathForRubro(rubro)
  const demoNombre = `Demo — ${template.label}`

  await prisma.empresa.update({
    where: { id: empresaId },
    data: {
      rubro,
      nombre: demoNombre,
      razonSocial: `${demoNombre} SRL`,
    },
  })

  let skusActivados: string[] = []
  let modoLite = "completo"
  let productosFromRetail = 0

  if (template.isRetail) {
    const engancheId = resolveIndustryEnganche(template)
    const retail = await applyRetailOnboarding({
      empresaId,
      rubro: template.id,
      engancheId,
      origen: "industry_demo",
      trialDias: 30,
    })
    skusActivados = retail.skusActivados
    modoLite = retail.modoLite
    productosFromRetail = retail.productosCreados
  } else {
    await parametrizarEmpresa(empresaId, template.parametrizacionKey)
    await setIndustryModules(empresaId, rubro)

    await prisma.parametroFiscal.upsert({
      where: { empresaId_clave_pais: { empresaId, clave: "onboarding_completado", pais: "AR" } },
      update: { valor: 1 },
      create: {
        empresaId,
        clave: "onboarding_completado",
        valor: 1,
        descripcion: `Demo industria: ${template.id}`,
        categoria: "operativo",
        pais: "AR",
      },
    })

    if (template.engancheId) {
      const trialDiasNicho = 14
      const enganche = await applyIndustryEnganche(empresaId, template.engancheId, trialDiasNicho)
      skusActivados = enganche.skusActivados
      modoLite = enganche.modoLite
    }
  }

  const seeds = await seedIndustryDemoData(empresaId, template)

  await prisma.parametroFiscal.upsert({
    where: { empresaId_clave_pais: { empresaId, clave: "demo_industry_id", pais: "AR" } },
    update: { valor: 1, descripcion: template.id },
    create: {
      empresaId,
      clave: "demo_industry_id",
      valor: 1,
      descripcion: template.id,
      categoria: "operativo",
      pais: "AR",
    },
  })

  const trialDias = template.isRetail ? 30 : 14
  await setTrialExpiresAt(
    empresaId,
    new Date(Date.now() + trialDias * 24 * 60 * 60 * 1000),
    trialDias,
  )

  return {
    industryId: template.id,
    rubro,
    goldenPath,
    empresaNombre: demoNombre,
    productosCreados: productosFromRetail + seeds.productos,
    clientesCreados: seeds.clientes,
    skusActivados,
    modoLite,
  }
}