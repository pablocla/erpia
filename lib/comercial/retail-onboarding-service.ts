/**
 * Onboarding retail server-side — usado por dashboard, provisioning y relevamiento calle.
 */

import { prisma } from "@/lib/prisma"
import { setTrialExpiresAt } from "@/lib/comercial/trial-service"
import { parametrizarEmpresa } from "@/lib/config/parametrizacion-rubro"
import { activarPack, activarProducto } from "@/lib/platform/product-lifecycle"
import { getPackHorizontal } from "@/lib/platform/product-registry"
import {
  inferModoLiteFromEnganche,
  landingPathParaModoLite,
  parametrizacionParaRubro,
  resolvePackCalle,
  skusParaActivar,
  type ModoLite,
} from "@/lib/comercial/pack-calle-catalog"
import {
  persistOfertaEmpresa,
  resolveOferta,
  skuEsAnclaGratis,
  skusAdicionalesOferta,
  vigenciaParaSku,
} from "@/lib/comercial/ofertas-comerciales"
import { PACK_PROPIEDAD } from "@/lib/comercial/hybrid-provision-bridge"
import { iniciarOnboardingPropiedad } from "@/lib/comercial/propiedad-onboarding"

export interface ProductoOnboardingInput {
  nombre: string
  precioVenta: number
  codigoBarras?: string
  porcentajeIva?: number
  unidad?: string
}

export interface ApplyRetailOnboardingInput {
  empresaId: number
  rubro: string
  engancheId?: string
  modoLite?: ModoLite
  productos?: ProductoOnboardingInput[]
  trialDias?: number
  origen?: string
  /** Usuario existente: solo activar SKU + modoLite sin seed de productos */
  skipSeed?: boolean
}

export interface ApplyRetailOnboardingResult {
  rubro: string
  modoLite: ModoLite
  engancheId: string
  productosCreados: number
  skusActivados: string[]
  landingPath: string
  trialExpiresAt: string
}

export function getProductosSeed(rubro: string): ProductoOnboardingInput[] {
  const seeds: Record<string, ProductoOnboardingInput[]> = {
    kiosco: [
      { nombre: "Coca-Cola 500ml", precioVenta: 1200, codigoBarras: "7790895000451", porcentajeIva: 21 },
      { nombre: "Alfajor Guaymallen Chocolate", precioVenta: 500, codigoBarras: "7791234560012", porcentajeIva: 21 },
      { nombre: "Agua Mineral Villavicencio 500ml", precioVenta: 800, codigoBarras: "7791234560043", porcentajeIva: 10.5 },
    ],
    almacen: [
      { nombre: "Leche Entera La Serenisima 1L", precioVenta: 1350, codigoBarras: "7790080031124", porcentajeIva: 21 },
      { nombre: "Yerba Playadito 1kg", precioVenta: 3800, codigoBarras: "7791234580027", porcentajeIva: 21 },
      { nombre: "Azúcar Ledesma 1kg", precioVenta: 1200, codigoBarras: "7791234580034", porcentajeIva: 21 },
      { nombre: "Aceite Natura Girasol 900ml", precioVenta: 2100, codigoBarras: "7791234580041", porcentajeIva: 21 },
      { nombre: "Arroz Gallo Oro Largo Fino 1kg", precioVenta: 1700, codigoBarras: "7791234580065", porcentajeIva: 21 },
    ],
    ferreteria: [
      { nombre: "Cinta Aisladora Tacsa Negra", precioVenta: 950, codigoBarras: "7791234570011", porcentajeIva: 21 },
      { nombre: "Destornillador Phillips 1/4x4", precioVenta: 3800, codigoBarras: "7791234570028", porcentajeIva: 21 },
    ],
    carniceria: [
      { nombre: "Asado de Tira x kg", precioVenta: 7500, porcentajeIva: 10.5, unidad: "kg" },
      { nombre: "Vacío de Ternera x kg", precioVenta: 8500, porcentajeIva: 10.5, unidad: "kg" },
    ],
    panaderia: [
      { nombre: "Pan Francés x kg", precioVenta: 2000, porcentajeIva: 10.5, unidad: "kg" },
      { nombre: "Facturas surtidas (x docena)", precioVenta: 4800, porcentajeIva: 10.5, unidad: "docena" },
    ],
  }
  return seeds[rubro] ?? seeds.almacen!
}

async function activarEnganche(empresaId: number, engancheId: string, origen: string): Promise<string[]> {
  const pack = resolvePackCalle(engancheId)
  if (!pack) return []

  const oferta = resolveOferta(engancheId, pack.modoLite)
  const limitarAncla = oferta.autoActivarMonetizados === false
  const skusPermitidos = (skus: string[]) =>
    limitarAncla
      ? skus.filter((sku) => skuEsAnclaGratis(oferta, sku) || sku === engancheId)
      : skus

  if (pack.tipo === "pack" && getPackHorizontal(engancheId) && !limitarAncla) {
    await activarPack(empresaId, engancheId, origen)
    return pack.skus
  }

  const activados: string[] = []
  for (const sku of skusPermitidos(skusParaActivar(engancheId))) {
    try {
      await activarProducto(empresaId, sku, origen)
      activados.push(sku)
    } catch (err) {
      console.warn(`[retail-onboarding] No se pudo activar ${sku}:`, err)
    }
  }
  return activados
}

export async function applyRetailOnboarding(
  input: ApplyRetailOnboardingInput,
): Promise<ApplyRetailOnboardingResult> {
  const {
    empresaId,
    rubro,
    engancheId = "pos.fiado_barrio",
    modoLite: modoLiteInput,
    productos: userProducts,
    trialDias = 14,
    origen = "retail_onboarding",
    skipSeed = false,
  } = input

  const pack = resolvePackCalle(engancheId)
  let modoLite = modoLiteInput ?? pack?.modoLite ?? inferModoLiteFromEnganche(engancheId)
  // Evitar ERP completo ruidoso en onboarding retail salvo pack que lo pida
  if (modoLite === "completo" && !pack?.modoLite) {
    const { defaultModoLiteForRubro } = await import("@/lib/comercial/nav-matrix")
    modoLite = defaultModoLiteForRubro(rubro)
  }
  const trialExpiresAt = new Date(Date.now() + trialDias * 24 * 60 * 60 * 1000)

  await prisma.empresa.update({
    where: { id: empresaId },
    data: { rubro, modoLite },
  })

  await parametrizarEmpresa(empresaId, parametrizacionParaRubro(rubro), {
    mode: origen === "industry_demo" ? "demo" : "full",
  })

  await prisma.productoComercial.upsert({
    where: { sku: "pos.fiado_barrio" },
    update: { precioArs: 0, nombre: "Libreta Fiado", descripcion: "Libreta Fiado — ancla gratis" },
    create: {
      sku: "pos.fiado_barrio",
      nombre: "Libreta Fiado",
      descripcion: "Libreta Fiado — ancla gratis permanente",
      precioArs: 0,
      activo: true,
    },
  })

  const skusActivados = await activarEnganche(empresaId, engancheId, origen)
  const oferta = resolveOferta(engancheId, modoLite)

  for (const sku of skusAdicionalesOferta(oferta, skusActivados)) {
    try {
      await activarProducto(empresaId, sku, origen)
      skusActivados.push(sku)
    } catch (err) {
      console.warn(`[retail-onboarding] No se pudo activar monetizado ${sku}:`, err)
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

  let creados = 0
  if (!skipSeed) {
  const seedList = getProductosSeed(rubro)
  const allProducts = [...seedList, ...(userProducts ?? [])]

  for (const [index, p] of allProducts.entries()) {
    const generatedCode = p.codigoBarras || `ONB-${rubro.toUpperCase().slice(0, 3)}-${String(index + 1).padStart(3, "0")}`
    const existe = await prisma.producto.findFirst({
      where: {
        empresaId,
        OR: [{ codigo: generatedCode }, ...(p.codigoBarras ? [{ codigoBarras: p.codigoBarras }] : [])],
      },
    })
    if (!existe) {
      await prisma.producto.create({
        data: {
          empresaId,
          codigo: generatedCode,
          nombre: p.nombre,
          precioVenta: p.precioVenta,
          porcentajeIva: p.porcentajeIva ?? 21,
          codigoBarras: p.codigoBarras || null,
          activo: true,
          unidad: p.unidad ?? "unidad",
          stock: 100,
        },
      })
      creados++
    }
  }
  }

  const cfExiste = await prisma.cliente.findFirst({
    where: { empresaId, nombre: { contains: "Consumidor Final", mode: "insensitive" } },
  })
  if (!cfExiste) {
    await prisma.cliente.create({
      data: {
        empresaId,
        nombre: "Consumidor Final",
        condicionIva: "Consumidor Final",
        activo: true,
      },
    })
  }

  await prisma.parametroFiscal.upsert({
    where: { empresaId_clave_pais: { empresaId, clave: "onboarding_completado", pais: "AR" } },
    update: { valor: 1 },
    create: {
      empresaId,
      clave: "onboarding_completado",
      valor: 1,
      descripcion: "Onboarding retail aplicado",
      categoria: "operativo",
      pais: "AR",
    },
  })

  if (oferta.trialScope !== "nada" && trialDias > 0) {
    await setTrialExpiresAt(empresaId, trialExpiresAt, trialDias)
  }

  if (engancheId === PACK_PROPIEDAD) {
    await prisma.empresa.update({
      where: { id: empresaId },
      data: { modoLite: "niche", rubro: "inmobiliaria" },
    })
    await iniciarOnboardingPropiedad(empresaId, origen)
  }

  const landingPath =
    engancheId === PACK_PROPIEDAD
      ? "/dashboard/nicho/consorcios"
      : landingPathParaModoLite(modoLite)

  return {
    rubro: engancheId === PACK_PROPIEDAD ? "inmobiliaria" : rubro,
    modoLite: engancheId === PACK_PROPIEDAD ? "niche" : modoLite,
    engancheId,
    productosCreados: creados,
    skusActivados,
    landingPath,
    trialExpiresAt: trialExpiresAt.toISOString(),
  }
}