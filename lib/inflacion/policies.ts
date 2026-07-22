/**
 * Políticas de gatillo por subsystem (platform Claver + por empresa).
 * Defaults en memoria; persistencia empresa vía API puede extenderse a Prisma.
 */

import type { InflacionPolicyConfig, InflacionSubsystem } from "./types"

/** Política de Claver-as-vendor: indexar precios de suscripción */
export const PLATFORM_BILLING_POLICY: InflacionPolicyConfig = {
  scope: "platform",
  empresaId: null,
  subsystem: "billing_claver",
  activo: true,
  indiceCodigo: "IPC_NACIONAL",
  /** Tope 5% de suba por “paso” de reajuste de catálogo (acumulado desde precioBasePeriodo) se aplica en billing-trigger */
  topeVariacionPeriodo: 0.5, // 50% max acumulado desde base de precio (protección comercial)
  diasGraciaNominal: 0,
  soloInformativo: false,
  diaPublicacion: 15,
  notas: "Ajuste de ARPU/packs Claver. Comunicar en Términos y en factura.",
}

/** Defaults por subsystem tenant (usuario del ERP) */
export const DEFAULT_TENANT_POLICIES: Record<
  Exclude<InflacionSubsystem, "billing_claver">,
  InflacionPolicyConfig
> = {
  fiado: {
    scope: "empresa",
    subsystem: "fiado",
    activo: false, // opt-in (legal + fricción social)
    indiceCodigo: "IPC_NACIONAL",
    topeVariacionPeriodo: 0.25,
    diasGraciaNominal: 15,
    soloInformativo: true, // MVP: mostrar pérdida; cobrar ajuste solo si policy.soloInformativo=false
    diaPublicacion: 15,
    notas: "Fiado Protegido — default informativo hasta validación legal.",
  },
  cxc: {
    scope: "empresa",
    subsystem: "cxc",
    activo: false,
    indiceCodigo: "IPC_NACIONAL",
    topeVariacionPeriodo: 0.25,
    diasGraciaNominal: 15,
    soloInformativo: true,
    diaPublicacion: 15,
  },
  cxp: {
    scope: "empresa",
    subsystem: "cxp",
    activo: false,
    indiceCodigo: "IPC_NACIONAL",
    topeVariacionPeriodo: null,
    diasGraciaNominal: 0,
    soloInformativo: true,
    diaPublicacion: 15,
    notas: "Solo reexpresión informativa de pasivo.",
  },
  listas_precio: {
    scope: "empresa",
    subsystem: "listas_precio",
    activo: false,
    indiceCodigo: "IPC_NACIONAL",
    topeVariacionPeriodo: 0.15,
    diasGraciaNominal: 0,
    soloInformativo: false,
    diaPublicacion: 15,
  },
  presupuestos: {
    scope: "empresa",
    subsystem: "presupuestos",
    activo: false,
    indiceCodigo: "IPC_NACIONAL",
    topeVariacionPeriodo: 0.1,
    diasGraciaNominal: 0,
    soloInformativo: true,
    diaPublicacion: 15,
  },
  custom: {
    scope: "empresa",
    subsystem: "custom",
    activo: false,
    indiceCodigo: "IPC_NACIONAL",
    topeVariacionPeriodo: null,
    diasGraciaNominal: 15,
    soloInformativo: true,
    diaPublicacion: 15,
  },
}

/** Overrides en memoria por empresaId:subsystem */
const empresaOverrides = new Map<string, InflacionPolicyConfig>()

function key(empresaId: number, subsystem: InflacionSubsystem) {
  return `${empresaId}:${subsystem}`
}

export function getPlatformBillingPolicy(): InflacionPolicyConfig {
  return { ...PLATFORM_BILLING_POLICY }
}

export function getTenantPolicy(
  empresaId: number,
  subsystem: InflacionSubsystem,
): InflacionPolicyConfig {
  if (subsystem === "billing_claver") {
    return getPlatformBillingPolicy()
  }
  const k = key(empresaId, subsystem)
  const over = empresaOverrides.get(k)
  if (over) return { ...over, empresaId }
  const base = DEFAULT_TENANT_POLICIES[subsystem as Exclude<InflacionSubsystem, "billing_claver">]
  return { ...base, empresaId }
}

export function setTenantPolicy(
  empresaId: number,
  subsystem: InflacionSubsystem,
  patch: Partial<InflacionPolicyConfig>,
): InflacionPolicyConfig {
  if (subsystem === "billing_claver") {
    throw new Error("La política billing_claver es de plataforma; no se edita por empresa")
  }
  const current = getTenantPolicy(empresaId, subsystem)
  const next: InflacionPolicyConfig = {
    ...current,
    ...patch,
    scope: "empresa",
    empresaId,
    subsystem,
  }
  empresaOverrides.set(key(empresaId, subsystem), next)
  return next
}

export function listTenantPolicies(empresaId: number): InflacionPolicyConfig[] {
  const subs = Object.keys(DEFAULT_TENANT_POLICIES) as Array<
    Exclude<InflacionSubsystem, "billing_claver">
  >
  return subs.map((s) => getTenantPolicy(empresaId, s))
}
