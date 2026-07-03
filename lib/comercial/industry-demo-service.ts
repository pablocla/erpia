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