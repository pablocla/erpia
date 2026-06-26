import {
  FEATURES,
  getFeatureConfig,
  getFeatureParam,
  setFeature,
} from "@/lib/config/rubro-config-service"
import { prisma } from "@/lib/prisma"
import type { ModoErp, OpoConector, OpoOrigen, OpoTenantConfig } from "./types"

export const OPO_SKU = "bridge.opo_studio"
export const OPO_FEATURE = FEATURES.OPO_STUDIO

const DEFAULT_CONFIG: OpoTenantConfig = {
  activo: false,
  modoErp: "full",
  origen: "clavis_db",
  conector: "rest",
  baseUrl: "",
  agentApiKey: "",
  sqlViewPrefix: "vw_opo_",
}

function mergeConfig(raw: Record<string, unknown> | undefined): OpoTenantConfig {
  if (!raw) return { ...DEFAULT_CONFIG }
  return {
    activo: Boolean(raw.activo ?? DEFAULT_CONFIG.activo),
    modoErp: (raw.modoErp as ModoErp) ?? DEFAULT_CONFIG.modoErp,
    origen: (raw.origen as OpoOrigen) ?? DEFAULT_CONFIG.origen,
    conector: (raw.conector as OpoConector) ?? DEFAULT_CONFIG.conector,
    baseUrl: typeof raw.baseUrl === "string" ? raw.baseUrl : DEFAULT_CONFIG.baseUrl,
    agentApiKey: typeof raw.agentApiKey === "string" ? raw.agentApiKey : DEFAULT_CONFIG.agentApiKey,
    sqlViewPrefix:
      typeof raw.sqlViewPrefix === "string" ? raw.sqlViewPrefix : DEFAULT_CONFIG.sqlViewPrefix,
  }
}

export async function getOpoConfig(empresaId: number): Promise<OpoTenantConfig> {
  const feature = await getFeatureConfig(empresaId, OPO_FEATURE)
  const merged = mergeConfig(feature.parametros)
  return { ...merged, activo: feature.activado }
}

export async function patchOpoConfig(
  empresaId: number,
  patch: Partial<OpoTenantConfig>,
): Promise<OpoTenantConfig> {
  const current = await getOpoConfig(empresaId)
  const next: OpoTenantConfig = { ...current, ...patch }

  await setFeature(empresaId, OPO_FEATURE, {
    activado: next.activo,
    parametros: {
      modoErp: next.modoErp,
      origen: next.origen,
      conector: next.conector,
      baseUrl: next.baseUrl ?? "",
      agentApiKey: next.agentApiKey ?? "",
      sqlViewPrefix: next.sqlViewPrefix ?? "vw_opo_",
      activo: next.activo,
    },
  })

  return next
}

export async function provisionOpoDefaults(empresaId: number) {
  const baseUrl = await getFeatureParam(empresaId, OPO_FEATURE, "baseUrl", "")
  await setFeature(empresaId, OPO_FEATURE, {
    activado: true,
    parametros: {
      ...DEFAULT_CONFIG,
      activo: true,
      baseUrl: baseUrl || "",
      provisionedAt: new Date().toISOString(),
    },
  })
}

export async function getEmpresaNombre(empresaId: number) {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { nombre: true, razonSocial: true },
  })
  return empresa?.razonSocial ?? empresa?.nombre ?? "Clavis Tenant"
}