/**
 * Ofertas comerciales — ancla gratis + módulos monetizados.
 * Fuente de verdad para empaquetado flexible (ej. Fiado gratis + POS de pago).
 */

import type { ModoLite } from "@/lib/comercial/pack-calle-catalog"
import { resolvePackCalle } from "@/lib/comercial/pack-calle-catalog"
import { getEngancheBySku } from "@/lib/marketplace/enganche-catalog"
import { resolveSku } from "@/lib/marketplace/catalog-resolver"
import { SUB_SAAS_APPS } from "@/lib/comercial/sub-saas-catalog"
import { precioCobrableSku, aplicarPisoPrecioSuscripcion } from "@/lib/comercial/precio-minimo"
import { resolvePrecioIndexadoSiAplica } from "@/lib/inflacion/billing-trigger"
import { prisma } from "@/lib/prisma"

export type TrialScope = "monetizar" | "todo" | "nada"

export interface OfertaComercial {
  id: string
  nombre: string
  lema: string
  anclaGratis: string[]
  monetizar: string[]
  /** Precio fijo del pack monetizado; si no hay, suma de SKUs */
  precioPackArs?: number
  modoLiteEntrada: ModoLite
  trialDias: number
  trialScope: TrialScope
  /**
   * Si false, el alta del ancla NO activa SKUs de pago en trial.
   * Los extras se prenden cuando el comercio los pide (paywall / Mi plan).
   */
  autoActivarMonetizados?: boolean
  engancheIds: string[]
}

const OFERTA_CLASICO: OfertaComercial = {
  id: "clasico-trial",
  nombre: "Trial completo",
  lema: "14 días para probar todo el enganche.",
  anclaGratis: [],
  monetizar: [],
  modoLiteEntrada: "completo",
  trialDias: 14,
  trialScope: "todo",
  engancheIds: [],
}

export const OFERTA_FIADO_ANCLA: OfertaComercial = {
  id: "fiado-ancla",
  nombre: "Claver Fiado + mostrador",
  lema: "Libreta y 1 caja, gratis para siempre. WhatsApp, AFIP y 2ª caja cuando duelan.",
  anclaGratis: ["pos.fiado_barrio"],
  monetizar: ["core.claver"],
  precioPackArs: 12900,
  modoLiteEntrada: "fiado",
  trialDias: 0,
  trialScope: "monetizar",
  autoActivarMonetizados: false,
  engancheIds: ["pos.fiado_barrio", "fiado"],
}

/** Presupuesto / trabajos en pantalla. Seña WA y MP son extra. */
export const OFERTA_OFICIOS_ANCLA: OfertaComercial = {
  id: "oficios-ancla",
  nombre: "Claver Oficios",
  lema: "Presupuesto en el celu, sin tarjeta. El link de seña y el WhatsApp se activan cuando cobrás.",
  anclaGratis: ["niche.oficios"],
  monetizar: ["intang.cobranzas_wa", "core.claver"],
  precioPackArs: 29900,
  modoLiteEntrada: "niche",
  trialDias: 0,
  trialScope: "monetizar",
  autoActivarMonetizados: false,
  engancheIds: ["niche.oficios", "oficios"],
}

export const OFERTA_POS_ANCLA: OfertaComercial = {
  id: "pos-ancla",
  nombre: "POS + Libreta Fiado",
  lema: "Mostrador y stock en trial 14 días. Después desde $12.900/mes. Fiado se activa gratis cuando lo necesités.",
  /** Sin ancla permanente de core: el trial monetiza el pack POS/ERP */
  anclaGratis: [],
  monetizar: ["core.claver"],
  precioPackArs: 12900,
  modoLiteEntrada: "pos",
  trialDias: 14,
  trialScope: "monetizar",
  engancheIds: ["pos.core", "core.claver", "pool-kiosco-barrio", "pool-almacen-rosario", "pos.balanza_peso"],
}

/** Pack contador — reportes + export + trial corto (upsell fácil post-fiado) */
export const OFERTA_CONTADOR: OfertaComercial = {
  id: "pack-contador",
  nombre: "Pack Contador",
  lema: "Libros, export y reportes listos para el estudio. Trial 14 días.",
  anclaGratis: [],
  monetizar: ["data.reportes_prog", "core.claver"],
  precioPackArs: 19900,
  modoLiteEntrada: "completo",
  trialDias: 14,
  trialScope: "monetizar",
  engancheIds: ["data.reportes_prog", "pack.contador", "contador"],
}

/** Setup one-shot (implementador cobra aparte o Claver cobra setup) */
export const SETUP_FEE_ARS = 50000
export const SETUP_FEE_SKU = "impl.setup_one_shot"

/** Hardware POS (checklist + SKU comercial) */
export const OFERTA_HARDWARE_POS: OfertaComercial = {
  id: "pack-hardware-pos",
  nombre: "Pack Hardware POS",
  lema: "Go-live con impresora, lectora y checklist de mostrador.",
  anclaGratis: [],
  monetizar: ["pack.hardware_pos", "core.claver"],
  precioPackArs: 89000,
  modoLiteEntrada: "pos",
  trialDias: 7,
  trialScope: "monetizar",
  engancheIds: ["pack.hardware_pos", "hardware", "pos.hardware"],
}

/** Cobranza as a service — fee % sobre recuperado */
export const OFERTA_COBRANZA_AAS: OfertaComercial = {
  id: "cobranza-aas",
  nombre: "Cobranza as a Service",
  lema: "Secretaria WA + fee solo sobre lo cobrado (default 5%).",
  anclaGratis: [],
  monetizar: ["svc.cobranza_as_a_service", "intang.cobranzas_wa"],
  precioPackArs: 0,
  modoLiteEntrada: "cobranza",
  trialDias: 14,
  trialScope: "monetizar",
  engancheIds: ["svc.cobranza_as_a_service", "cobranza-aas", "cobranza_aas"],
}

export const OFERTAS_COMERCIALES: OfertaComercial[] = [
  OFERTA_FIADO_ANCLA,
  OFERTA_OFICIOS_ANCLA,
  OFERTA_POS_ANCLA,
  OFERTA_CONTADOR,
  OFERTA_HARDWARE_POS,
  OFERTA_COBRANZA_AAS,
  OFERTA_CLASICO,
]

const OFERTA_BY_ID = Object.fromEntries(OFERTAS_COMERCIALES.map((o) => [o.id, o])) as Record<
  string,
  OfertaComercial
>

export function getOfertaById(id: string): OfertaComercial | null {
  return OFERTA_BY_ID[id] ?? null
}

export function resolvePrecioSku(sku: string): number {
  let base = 0
  const sub = SUB_SAAS_APPS.find((a) => a.sku === sku || a.skusAdicionales?.includes(sku))
  if (sub && sub.precioArs > 0) base = sub.precioArs
  else {
    const enganche = getEngancheBySku(sku)
    if (enganche && enganche.precioArs > 0) base = enganche.precioArs
    else {
      const catalog = resolveSku(sku)
      if (catalog && catalog.precioArs > 0) base = catalog.precioArs
    }
  }

  // Gatillo IPC plataforma (Claver cobra a tenants): CLAVER_INDEXAR_PRECIOS=1
  base = resolvePrecioIndexadoSiAplica(base)
  return precioCobrableSku(sku, base)
}

export function precioOfertaMonetizada(oferta: OfertaComercial): number {
  if (oferta.precioPackArs != null && oferta.precioPackArs > 0) {
    return aplicarPisoPrecioSuscripcion(resolvePrecioIndexadoSiAplica(oferta.precioPackArs))
  }
  const suma = oferta.monetizar.reduce((sum, sku) => sum + resolvePrecioSku(sku), 0)
  return aplicarPisoPrecioSuscripcion(suma)
}

export function resolveOferta(engancheId: string, modoLite?: ModoLite): OfertaComercial {
  const pack = resolvePackCalle(engancheId)
  if (pack?.tipo === "pack") return OFERTA_CLASICO

  for (const oferta of OFERTAS_COMERCIALES) {
    if (oferta.engancheIds.includes(engancheId)) return oferta
  }

  if (modoLite === "fiado") return OFERTA_FIADO_ANCLA
  if (modoLite === "pos") return OFERTA_POS_ANCLA

  return OFERTA_CLASICO
}

export function skuEsAnclaGratis(oferta: OfertaComercial, sku: string): boolean {
  return oferta.anclaGratis.includes(sku)
}

export function skuEsMonetizado(oferta: OfertaComercial, sku: string): boolean {
  if (oferta.trialScope === "todo" && oferta.monetizar.length === 0) return true
  return oferta.monetizar.includes(sku)
}

/** vigenciaHasta: null = gratis permanente; Date = trial o suscripción con fin */
export function vigenciaParaSku(
  oferta: OfertaComercial,
  sku: string,
  trialExpiresAt: Date,
): Date | null {
  if (oferta.anclaGratis.includes(sku)) return null

  if (oferta.trialScope === "nada") return null
  if (oferta.trialScope === "todo") return trialExpiresAt
  if (oferta.trialScope === "monetizar") {
    if (oferta.monetizar.includes(sku)) return trialExpiresAt
    if (oferta.anclaGratis.includes(sku)) return null
    return trialExpiresAt
  }

  return trialExpiresAt
}

export function skusAdicionalesOferta(oferta: OfertaComercial, yaActivados: string[]): string[] {
  if (oferta.autoActivarMonetizados === false) return []
  if (oferta.trialScope !== "monetizar") return []
  return oferta.monetizar.filter((sku) => !yaActivados.includes(sku))
}

export function esAltaAnclaSinTrial(oferta: OfertaComercial): boolean {
  return oferta.trialDias <= 0 || oferta.autoActivarMonetizados === false
}

const OFERTA_CLAVE = "oferta_comercial_id"
const OFERTA_PAIS = "AR"
const DEMO_ACTIVAR_CLAVE = "demo_activar_intent"

export async function persistOfertaEmpresa(empresaId: number, ofertaId: string): Promise<void> {
  await prisma.parametroFiscal.upsert({
    where: {
      empresaId_clave_pais: { empresaId, clave: OFERTA_CLAVE, pais: OFERTA_PAIS },
    },
    update: { descripcion: ofertaId, valor: 1 },
    create: {
      empresaId,
      clave: OFERTA_CLAVE,
      valor: 1,
      descripcion: ofertaId,
      categoria: "comercial",
      pais: OFERTA_PAIS,
    },
  })
}

export async function getOfertaEmpresaId(empresaId: number): Promise<string | null> {
  const row = await prisma.parametroFiscal.findUnique({
    where: {
      empresaId_clave_pais: { empresaId, clave: OFERTA_CLAVE, pais: OFERTA_PAIS },
    },
    select: { descripcion: true },
  })
  return row?.descripcion?.trim() || null
}

export async function getOfertaEmpresa(empresaId: number): Promise<OfertaComercial> {
  const id = await getOfertaEmpresaId(empresaId)
  if (id) return getOfertaById(id) ?? OFERTA_CLASICO
  return OFERTA_CLASICO
}

export async function persistDemoActivarIntent(empresaId: number, activar: string): Promise<void> {
  await prisma.parametroFiscal.upsert({
    where: {
      empresaId_clave_pais: { empresaId, clave: DEMO_ACTIVAR_CLAVE, pais: OFERTA_PAIS },
    },
    update: { descripcion: activar, valor: 1 },
    create: {
      empresaId,
      clave: DEMO_ACTIVAR_CLAVE,
      valor: 1,
      descripcion: activar,
      categoria: "comercial",
      pais: OFERTA_PAIS,
    },
  })
}

export async function getDemoActivarIntent(empresaId: number): Promise<string | null> {
  const row = await prisma.parametroFiscal.findUnique({
    where: {
      empresaId_clave_pais: { empresaId, clave: DEMO_ACTIVAR_CLAVE, pais: OFERTA_PAIS },
    },
    select: { descripcion: true },
  })
  return row?.descripcion?.trim() || null
}

export function nombreLegibleSku(sku: string): string {
  const sub = SUB_SAAS_APPS.find((a) => a.sku === sku || a.skusAdicionales?.includes(sku))
  if (sub) return sub.marca
  const eng = getEngancheBySku(sku)
  if (eng) return eng.nombre
  const cat = resolveSku(sku)
  return cat?.nombre ?? sku
}