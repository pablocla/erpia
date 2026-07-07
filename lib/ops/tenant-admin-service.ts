import { prisma } from "@/lib/prisma"
import { MARKETPLACE_CATALOG } from "@/lib/marketplace/marketplace-catalog"
import { MARKETPLACE_BUNDLES } from "@/lib/marketplace/bundles"
import { getRunbookOrDefault } from "@/lib/marketplace/product-runbooks"
import { provisionSku } from "@/lib/marketplace/provision-service"
import {
  activarPack,
  activarProducto,
  desactivarPack,
  desactivarProducto,
  obtenerEstadoProductos,
} from "@/lib/platform/product-lifecycle"
import { getEmpresaReadiness, type ReadinessReport } from "@/lib/ops/readiness-service"
import { getProyectoPorEmpresa } from "@/lib/ops/implementacion-service"
import { getTenantPlan, validarLimiteActivacion, type TenantPlanLimits } from "@/lib/ops/tenant-plan-service"
import { getTenantBilling, type TenantBillingRow } from "@/lib/ops/tenant-billing-service"
import { getSignupMeta, ORIGEN_LABELS, diasDesde, type SignupMeta } from "@/lib/ops/signup-tracking"
import {
  computeTenantLifecycle,
  getPipelineLeadForTenant,
  getTenantHealth,
  getTenantRecentActivity,
  type TenantActivityItem,
  type TenantHealth,
  type TenantLifecycle,
  type TenantPipelineLeadSummary,
} from "@/lib/ops/tenant-lifecycle-service"

function db() {
  return prisma as any
}

export interface TenantProductoRow {
  sku: string
  nombre: string
  categoria: string
  autoCertLevel: string
  precioArs: number
  status: string
  activo: boolean
  ccaFase: string
  activacionCliente: string
  tieneRunbookDedicado: boolean
}

export interface TenantPackRow {
  id: string
  nombre: string
  precioArs: number
  skus: string[]
  todoActivo: boolean
  algunoActivo: boolean
}

export interface TenantOverview {
  empresa: {
    id: number
    nombre: string
    razonSocial: string
    cuit: string | null
    rubro: string
    entornoAfip: string | null
    planHosting: string | null
    deletedAt: string | null
  }
  lifecycle: TenantLifecycle
  health: TenantHealth
  recentActivity: TenantActivityItem[]
  pipelineLead: TenantPipelineLeadSummary | null
  readiness: ReadinessReport
  productosActivos: number
  productosCatalogo: number
  proyecto: {
    id: number
    codigo: string
    faseActual: string
    porcentajeAvance: number
  } | null
  tareasPendientes: number
  packs: TenantPackRow[]
  productos: TenantProductoRow[]
  horizontales: Awaited<ReturnType<typeof obtenerEstadoProductos>>
  plan: TenantPlanLimits
  billing: TenantBillingRow
  comercial: {
    createdAt: string
    diasDesdeAlta: number
    signup: SignupMeta
    origenLabel: string
  }
}

export async function getTenantOverview(empresaId: number): Promise<TenantOverview> {
  const [
    empresa,
    readiness,
    horizontales,
    proyecto,
    tareasPendientes,
    suscripciones,
    plan,
    billing,
    signup,
    pipelineLead,
    health,
  ] = await Promise.all([
    db().empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nombre: true,
        razonSocial: true,
        cuit: true,
        rubro: true,
        entornoAfip: true,
        planHosting: true,
        createdAt: true,
        deletedAt: true,
      },
    }),
    getEmpresaReadiness(empresaId),
    obtenerEstadoProductos(empresaId),
    getProyectoPorEmpresa(empresaId),
    db().marketplaceTareaAnalista.count({
      where: { empresaId, estado: { in: ["pendiente", "en_curso", "escalada"] } },
    }),
    db().suscripcionModulo.findMany({
      where: { empresaId },
      select: { sku: true, activo: true },
    }),
    getTenantPlan(empresaId),
    getTenantBilling(empresaId),
    getSignupMeta(empresaId),
    getPipelineLeadForTenant(empresaId),
    getTenantHealth(empresaId),
  ])

  if (!empresa) throw new Error("Empresa no encontrada")

  const subMap = new Map(suscripciones.map((s: { sku: string; activo: boolean }) => [s.sku, s.activo]))

  const productos: TenantProductoRow[] = MARKETPLACE_CATALOG.map((item) => {
    const rb = getRunbookOrDefault(item.sku, item.nombre, item.autoCertLevel)
    return {
      sku: item.sku,
      nombre: item.nombre,
      categoria: item.categoria,
      autoCertLevel: item.autoCertLevel,
      precioArs: item.precioArs,
      status: item.status,
      activo: subMap.get(item.sku) === true,
      ccaFase: rb.ccaFase,
      activacionCliente: rb.activacionCliente,
      tieneRunbookDedicado: rb.sku === item.sku && rb.pasos.length > 2,
    }
  })

  const packs: TenantPackRow[] = MARKETPLACE_BUNDLES.map((b) => {
    const estados = b.skus.map((s) => subMap.get(s) === true)
    return {
      id: b.id,
      nombre: b.nombre,
      precioArs: b.precioPackArs,
      skus: b.skus,
      todoActivo: estados.length > 0 && estados.every(Boolean),
      algunoActivo: estados.some(Boolean),
    }
  })

  const recentActivity = await getTenantRecentActivity(empresaId, pipelineLead)

  const lifecycleFinal = computeTenantLifecycle({
    deletedAt: empresa.deletedAt,
    signup,
    productosActivos: productos.filter((p) => p.activo).length,
    mpSubscriptionStatus: billing.mpSubscriptionStatus,
    proyecto: proyecto
      ? { porcentajeAvance: proyecto.porcentajeAvance ?? 0 }
      : null,
    readiness,
    pipelineLead,
  })

  return {
    empresa: {
      id: empresa.id,
      nombre: empresa.nombre,
      razonSocial: empresa.razonSocial,
      cuit: empresa.cuit,
      rubro: empresa.rubro,
      entornoAfip: empresa.entornoAfip,
      planHosting: empresa.planHosting,
      deletedAt: empresa.deletedAt?.toISOString() ?? null,
    },
    lifecycle: lifecycleFinal,
    health,
    recentActivity,
    pipelineLead,
    readiness,
    productosActivos: productos.filter((p) => p.activo).length,
    productosCatalogo: productos.length,
    proyecto: proyecto
      ? {
          id: proyecto.id,
          codigo: proyecto.codigo,
          faseActual: proyecto.faseActual,
          porcentajeAvance: proyecto.porcentajeAvance ?? 0,
        }
      : null,
    tareasPendientes,
    packs,
    productos,
    horizontales,
    plan,
    billing,
    comercial: {
      createdAt: empresa.createdAt.toISOString(),
      diasDesdeAlta: diasDesde(empresa.createdAt),
      signup,
      origenLabel: signup.origen ? ORIGEN_LABELS[signup.origen] : "Sin etiqueta",
    },
  }
}

export type TenantProductoAccion =
  | "provision"
  | "activate"
  | "deactivate"
  | "provision_pack"
  | "activate_pack"
  | "deactivate_pack"

export async function ejecutarAccionProductoTenant(
  empresaId: number,
  input: { action: TenantProductoAccion; sku?: string; packId?: string },
  actorEmail: string,
) {
  const origen = `claver_cloud:${actorEmail}`

  const isActivation =
    input.action === "provision" ||
    input.action === "activate" ||
    input.action === "provision_pack" ||
    input.action === "activate_pack"

  if (isActivation) {
    await validarLimiteActivacion(empresaId, { requiereSuperAdmin: true })
  }

  switch (input.action) {
    case "provision": {
      if (!input.sku) throw new Error("sku requerido")
      return provisionSku(empresaId, input.sku, { iniciadoPor: origen })
    }
    case "activate": {
      if (!input.sku) throw new Error("sku requerido")
      return activarProducto(empresaId, input.sku, origen)
    }
    case "deactivate": {
      if (!input.sku) throw new Error("sku requerido")
      return desactivarProducto(empresaId, input.sku, origen)
    }
    case "provision_pack": {
      if (!input.packId) throw new Error("packId requerido")
      const pack = MARKETPLACE_BUNDLES.find((b) => b.id === input.packId)
      if (!pack) throw new Error("Pack no encontrado")
      const results = []
      for (const sku of pack.skus) {
        results.push(await provisionSku(empresaId, sku, { iniciadoPor: origen }))
      }
      return { packId: input.packId, results }
    }
    case "activate_pack": {
      if (!input.packId) throw new Error("packId requerido")
      return activarPack(empresaId, input.packId, origen)
    }
    case "deactivate_pack": {
      if (!input.packId) throw new Error("packId requerido")
      return desactivarPack(empresaId, input.packId, origen)
    }
    default:
      throw new Error("Acción no soportada")
  }
}