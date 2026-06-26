import {
  FEATURES,
  getFeatureConfig,
  getFeatureParam,
  setFeature,
} from "@/lib/config/rubro-config-service"
import { prisma } from "@/lib/prisma"
import { PROTHEUS_DEFAULT_MAPPINGS, resolveAccesoCanal } from "./entity-mappings-default"
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
  accesoCanal: "rest_directo",
  sqlModo: "direct",
  restDirectUrl: "",
  restAuthUser: "",
  restAuthPassword: "",
  sqlServer: "",
  sqlPort: 1433,
  sqlDatabase: "",
  sqlUser: "",
  sqlPassword: "",
  tableSuffix: "010",
  entityMappings: PROTHEUS_DEFAULT_MAPPINGS,
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
    accesoCanal:
      (raw.accesoCanal as OpoTenantConfig["accesoCanal"]) ??
      resolveAccesoCanal(
        (raw.conector as OpoConector) ?? DEFAULT_CONFIG.conector,
        typeof raw.baseUrl === "string" ? raw.baseUrl : undefined,
        typeof raw.restDirectUrl === "string" ? raw.restDirectUrl : undefined,
      ),
    sqlModo: (raw.sqlModo as OpoTenantConfig["sqlModo"]) ?? DEFAULT_CONFIG.sqlModo,
    restDirectUrl:
      typeof raw.restDirectUrl === "string" ? raw.restDirectUrl : DEFAULT_CONFIG.restDirectUrl,
    restAuthUser:
      typeof raw.restAuthUser === "string" ? raw.restAuthUser : DEFAULT_CONFIG.restAuthUser,
    restAuthPassword:
      typeof raw.restAuthPassword === "string"
        ? raw.restAuthPassword
        : DEFAULT_CONFIG.restAuthPassword,
    entityMappings: Array.isArray(raw.entityMappings)
      ? (raw.entityMappings as OpoTenantConfig["entityMappings"])
      : DEFAULT_CONFIG.entityMappings,
    bridgeTestedAt:
      typeof raw.bridgeTestedAt === "string" ? raw.bridgeTestedAt : undefined,
    bridgeTestOk: typeof raw.bridgeTestOk === "boolean" ? raw.bridgeTestOk : undefined,
    sqlServer: typeof raw.sqlServer === "string" ? raw.sqlServer : DEFAULT_CONFIG.sqlServer,
    sqlPort: typeof raw.sqlPort === "number" ? raw.sqlPort : DEFAULT_CONFIG.sqlPort,
    sqlDatabase: typeof raw.sqlDatabase === "string" ? raw.sqlDatabase : DEFAULT_CONFIG.sqlDatabase,
    sqlUser: typeof raw.sqlUser === "string" ? raw.sqlUser : DEFAULT_CONFIG.sqlUser,
    sqlPassword: typeof raw.sqlPassword === "string" ? raw.sqlPassword : DEFAULT_CONFIG.sqlPassword,
    tableSuffix: typeof raw.tableSuffix === "string" ? raw.tableSuffix : DEFAULT_CONFIG.tableSuffix,
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
      accesoCanal: next.accesoCanal,
      sqlModo: next.sqlModo,
      restDirectUrl: next.restDirectUrl ?? "",
      restAuthUser: next.restAuthUser ?? "",
      restAuthPassword: next.restAuthPassword ?? "",
      entityMappings: next.entityMappings ?? PROTHEUS_DEFAULT_MAPPINGS,
      bridgeTestedAt: next.bridgeTestedAt,
      bridgeTestOk: next.bridgeTestOk,
      sqlServer: next.sqlServer ?? "",
      sqlPort: next.sqlPort ?? 1433,
      sqlDatabase: next.sqlDatabase ?? "",
      sqlUser: next.sqlUser ?? "",
      sqlPassword: next.sqlPassword ?? "",
      tableSuffix: next.tableSuffix ?? "010",
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