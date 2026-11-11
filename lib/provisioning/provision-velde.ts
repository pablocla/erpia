/**
 * Provisioning idempotente del tenant "Velde".
 *
 * - Empresa Velde (CUIT placeholder DEMO-VELDE-0001, rubro comercio, modoLite pos, sin certificados).
 * - SIN AFIP: fiscal_modo_comprobante = ticket_solo + FeatureEmpresa facturacion_afip = false.
 *   "Facturar" en Velde = ticket interno no fiscal que mueve stock y caja.
 * - core.claver activo sin vencimiento: habilita escrituras /api/pos y /api/caja
 *   (api-sku-entitlements) y la 2ª caja abierta (caps-ancla segunda_caja).
 * - Plan tenant "Pro" (impersonacionErp=true) para entrar por Claver Cloud → "Ingresar ERP".
 * - CajaTipo CORRIENTE ("Corriente") y AHORRO ("Ahorro").
 * - Cliente "Consumidor Final" (el POS lo usa como fallback de cliente).
 *
 * NO crea usuarios. Acceso: el owner/analista Claver entra desde Claver Cloud con
 * "Ingresar ERP" (lib/ops/impersonation-service.ts), que exige plan con impersonacionErp.
 * No se crea AnalistaAsignacion: si el owner tuviera una asignación pasaría de scope
 * "all" a "assigned" (lib/auth/claver-analyst.ts) y perdería el resto de los tenants.
 * Correr N veces deja el mismo estado.
 */
import { prisma } from "@/lib/prisma"
import { whereEmpresa } from "@/lib/auth/empresa-guard"
import { saveFiscalEmissionConfig } from "@/lib/fiscal/emission-config"
import { setFeature } from "@/lib/config/rubro-config-service"
import { FEATURE_FACTURACION_AFIP } from "@/lib/fiscal/afip-off-guard"
import { setTenantPlan } from "@/lib/ops/tenant-plan-service"

export const VELDE_CUIT = "DEMO-VELDE-0001"
export const VELDE_NOMBRE = "Velde"
/**
 * core.claver: lo aceptan api-sku-entitlements (/api/pos, /api/caja) y
 * caps-ancla para abrir la 2ª caja (DISPAROS_CONFIG.segunda_caja.skusValidos).
 */
export const VELDE_SKU_MULTICAJA = "core.claver"
/** Plan con impersonacionErp=true (tenant-plan-limits). */
export const VELDE_PLAN = "Pro" as const

export const VELDE_CAJA_TIPOS = [
  { codigo: "CORRIENTE", nombre: "Corriente", tipo: "principal" },
  { codigo: "AHORRO", nombre: "Ahorro", tipo: "secundaria" },
] as const

export interface ProvisionVeldeResult {
  empresaId: number
  empresaCreada: boolean
  cajaTipos: Array<{ id: number; codigo: string; nombre: string }>
  consumidorFinalId: number
  skuMultiCaja: string
  plan: typeof VELDE_PLAN
  /** Sin usuarios propios: se opera vía Claver Cloud → "Ingresar ERP". */
  acceso: "claver_cloud_ingresar_erp"
}

export async function provisionVelde(): Promise<ProvisionVeldeResult> {
  const existente = await prisma.empresa.findUnique({
    where: { cuit: VELDE_CUIT },
    select: { id: true },
  })

  const empresa = existente
    ? existente
    : await prisma.empresa.create({
        data: {
          nombre: VELDE_NOMBRE,
          razonSocial: VELDE_NOMBRE,
          cuit: VELDE_CUIT,
          rubro: "comercio",
          modoLite: "pos",
        },
        select: { id: true },
      })
  const empresaId = empresa.id

  // ── Sin AFIP: solo ticket interno ─────────────────────────
  await saveFiscalEmissionConfig(empresaId, {
    modoComprobante: "ticket_solo",
    permitirTicketSinAfip: true,
  })
  await setFeature(empresaId, FEATURE_FACTURACION_AFIP, { activado: false })

  // ── Entitlement 2ª caja abierta ──────────────────────────
  await prisma.productoComercial.upsert({
    where: { sku: VELDE_SKU_MULTICAJA },
    create: {
      sku: VELDE_SKU_MULTICAJA,
      nombre: "Claver POS",
      descripcion: "ERP Base",
      precioArs: 0,
      activo: true,
    },
    update: {},
  })
  await prisma.suscripcionModulo.upsert({
    where: { empresaId_sku: { empresaId, sku: VELDE_SKU_MULTICAJA } },
    create: {
      empresaId,
      sku: VELDE_SKU_MULTICAJA,
      activo: true,
      vigenciaHasta: null,
      metadata: { origen: "provision_velde" },
    },
    update: { activo: true, vigenciaHasta: null },
  })

  // ── Plan Pro (impersonacionErp) para "Ingresar ERP" ──────
  await setTenantPlan(empresaId, VELDE_PLAN)

  // ── Cajas: Corriente y Ahorro ────────────────────────────
  const cajaTipos: ProvisionVeldeResult["cajaTipos"] = []
  for (const t of VELDE_CAJA_TIPOS) {
    const row = await prisma.cajaTipo.upsert({
      where: { empresaId_codigo: { empresaId, codigo: t.codigo } },
      create: { empresaId, codigo: t.codigo, nombre: t.nombre, tipo: t.tipo, activo: true },
      update: { nombre: t.nombre, activo: true },
      select: { id: true, codigo: true, nombre: true },
    })
    cajaTipos.push(row)
  }

  // ── Cliente fallback del POS ─────────────────────────────
  const cf = await prisma.cliente.findFirst({
    where: whereEmpresa(empresaId, { nombre: { contains: "consumidor", mode: "insensitive" } }),
    select: { id: true },
  })
  const consumidorFinal =
    cf ??
    (await prisma.cliente.create({
      data: { empresaId, nombre: "Consumidor Final", condicionIva: "Consumidor Final" },
      select: { id: true },
    }))

  return {
    empresaId,
    empresaCreada: !existente,
    cajaTipos,
    consumidorFinalId: consumidorFinal.id,
    skuMultiCaja: VELDE_SKU_MULTICAJA,
    plan: VELDE_PLAN,
    acceso: "claver_cloud_ingresar_erp",
  }
}
