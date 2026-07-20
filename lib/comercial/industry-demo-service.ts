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
import {
  persistOfertaEmpresa,
  resolveOferta,
  skusAdicionalesOferta,
  vigenciaParaSku,
} from "@/lib/comercial/ofertas-comerciales"
import {
  partitionSkusForAutoActivate,
  resolveAutoSubscribe,
} from "@/lib/comercial/product-auto-subscribe"

export interface ProvisionIndustryDemoResult {
  industryId: string
  rubro: string
  goldenPath: string
  empresaNombre: string
  productosCreados: number
  clientesCreados: number
  skusActivados: string[]
  modoLite: string
  /** SKUs que el sistema no auto-activó (analista / planned) */
  skusRequiereAnalista: string[]
  skusBloqueados: string[]
}

export function resolveIndustryId(raw: string): IndustryTemplate | null {
  return getIndustryTemplate(raw) ?? getIndustryTemplate(normalizeRubroValue(raw))
}

async function applyIndustryEnganche(
  empresaId: number,
  engancheId: string,
  trialDias: number,
): Promise<{
  skusActivados: string[]
  modoLite: ModoLite
  skusRequiereAnalista: string[]
  skusBloqueados: string[]
}> {
  const pack = resolvePackCalle(engancheId)
  const modoLite = pack?.modoLite ?? inferModoLiteFromEnganche(engancheId)
  const trialExpiresAt = new Date(Date.now() + trialDias * 24 * 60 * 60 * 1000)
  const origen = "industry_demo"
  const activados: string[] = []

  const candidatos = skusParaActivar(engancheId)
  const partition = partitionSkusForAutoActivate(candidatos, {
    context: "industry_demo",
    engancheId,
    modoLite,
    origen,
  })

  await prisma.empresa.update({
    where: { id: empresaId },
    data: { modoLite },
  })

  if (pack?.tipo === "pack" && getPackHorizontal(engancheId)) {
    // Pack: solo activar SKUs auto (skip planned/analyst)
    for (const sku of partition.auto) {
      try {
        await activarProducto(empresaId, sku, `${origen}:${engancheId}`)
        activados.push(sku)
      } catch (err) {
        console.warn(`[industry-demo] No se pudo activar ${sku}:`, err)
      }
    }
  } else {
    for (const sku of partition.auto) {
      try {
        await activarProducto(empresaId, sku, origen)
        activados.push(sku)
      } catch (err) {
        console.warn(`[industry-demo] No se pudo activar ${sku}:`, err)
      }
    }
  }

  const skusActivados = new Set(activados)
  for (const sku of partition.auto) {
    const sub = await getActiveSubscription(empresaId, sku)
    if (sub) skusActivados.add(sku)
  }
  const fiado = await getActiveSubscription(empresaId, "pos.fiado_barrio")
  if (fiado) skusActivados.add("pos.fiado_barrio")

  // Misma lógica que retail: ancla gratis = vigenciaHasta null + oferta persistida
  const oferta = resolveOferta(engancheId, modoLite)
  for (const sku of skusAdicionalesOferta(oferta, [...skusActivados])) {
    const decision = resolveAutoSubscribe(sku, {
      context: "industry_demo",
      engancheId,
      modoLite,
      origen,
    })
    if (!decision.canAutoActivate) {
      if (decision.mode === "blocked") partition.blocked.push(sku)
      else partition.analyst.push(sku)
      continue
    }
    try {
      await activarProducto(empresaId, sku, origen)
      skusActivados.add(sku)
    } catch (err) {
      console.warn(`[industry-demo] No se pudo activar monetizado ${sku}:`, err)
    }
  }

  for (const sku of skusActivados) {
    const vigenciaHasta = vigenciaParaSku(oferta, sku, trialExpiresAt)
    await prisma.suscripcionModulo.upsert({
      where: { empresaId_sku: { empresaId, sku } },
      update: { activo: true, vigenciaHasta },
      create: { empresaId, sku, activo: true, vigenciaHasta },
    })
  }
  await persistOfertaEmpresa(empresaId, oferta.id)

  if (partition.analyst.length || partition.blocked.length) {
    console.info(
      `[industry-demo] empresa=${empresaId} auto=${[...skusActivados].join(",")} analyst=${partition.analyst.join(",")} blocked=${partition.blocked.join(",")}`,
    )
  }

  return {
    skusActivados: [...skusActivados],
    modoLite,
    skusRequiereAnalista: [...new Set(partition.analyst)],
    skusBloqueados: [...new Set(partition.blocked)],
  }
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
  
  const empresaActual = await prisma.empresa.findUniqueOrThrow({ where: { id: empresaId } })
  const demoHash = empresaActual.cuit.split("-")[1] ?? "demo"
  const demoNombre = `Demo ${template.label} — ${demoHash}`

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
  let skusRequiereAnalista: string[] = []
  let skusBloqueados: string[] = []

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
    // Retail ya auto-activa el pack; clasificar qué queda fuera de auto
    const part = partitionSkusForAutoActivate(skusActivados, {
      context: "industry_demo",
      engancheId,
      modoLite: retail.modoLite as ModoLite,
    })
    skusRequiereAnalista = part.analyst
    skusBloqueados = part.blocked
  } else {
    await parametrizarEmpresa(empresaId, template.parametrizacionKey, { mode: "demo" })
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
      skusRequiereAnalista = enganche.skusRequiereAnalista
      skusBloqueados = enganche.skusBloqueados
    }
  }

  // Retail ya sembró productos en onboarding — evitar catálogo duplicado DEMO-/ONB-
  // Seeds no deben tumbar la demo: si fallan, igual devolvemos JWT + goldenPath
  let seeds = { productos: 0, clientes: 0 }
  try {
    seeds = await seedIndustryDemoData(empresaId, template, {
      skipProductos: template.isRetail,
    })
  } catch (err) {
    console.warn(`[industry-demo] Seeds parciales fallaron empresa=${empresaId}:`, err)
  }

  try {
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
  } catch (err) {
    console.warn(`[industry-demo] No se pudo marcar demo_industry_id:`, err)
  }

  const trialDias = template.isRetail ? 30 : 14
  try {
    await setTrialExpiresAt(
      empresaId,
      new Date(Date.now() + trialDias * 24 * 60 * 60 * 1000),
      trialDias,
    )
  } catch (err) {
    console.warn(`[industry-demo] setTrialExpiresAt falló:`, err)
  }

  return {
    industryId: template.id,
    rubro,
    goldenPath,
    empresaNombre: demoNombre,
    productosCreados: productosFromRetail + seeds.productos,
    clientesCreados: seeds.clientes,
    skusActivados,
    modoLite,
    skusRequiereAnalista,
    skusBloqueados,
  }
}