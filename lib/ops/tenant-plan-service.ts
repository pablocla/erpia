import { prisma } from "@/lib/prisma"
import { getProyectoPorEmpresa } from "@/lib/ops/implementacion-service"
import {
  TENANT_PLAN_LIMITS,
  type TenantPlanId,
  type TenantPlanLimits,
} from "@/lib/ops/tenant-plan-limits"

export type { TenantPlanId, TenantPlanLimits }
export { TENANT_PLAN_LIMITS }

function db() {
  return prisma as any
}

async function readPlanFromMetadata(empresaId: number): Promise<TenantPlanId> {
  const proyecto = await getProyectoPorEmpresa(empresaId)
  const meta = (proyecto?.metadata ?? {}) as Record<string, unknown>
  const plan = meta.planComercial as TenantPlanId | undefined
  if (plan && TENANT_PLAN_LIMITS[plan]) return plan
  return "Pro"
}

async function writePlanMetadata(empresaId: number, planId: TenantPlanId) {
  let proyecto = await getProyectoPorEmpresa(empresaId)
  if (!proyecto) {
    proyecto = await db().proyectoImplementacion.create({
      data: {
        empresaId,
        codigo: `CCA-${empresaId}`,
        faseActual: "CCA-010",
        metadata: { planComercial: planId },
      },
    })
    return
  }
  const meta = (proyecto.metadata && typeof proyecto.metadata === "object" ? proyecto.metadata : {}) as Record<string, unknown>
  await db().proyectoImplementacion.update({
    where: { empresaId },
    data: { metadata: { ...meta, planComercial: planId } },
  })
}

export async function getTenantPlan(empresaId: number): Promise<TenantPlanLimits> {
  const id = await readPlanFromMetadata(empresaId)
  return TENANT_PLAN_LIMITS[id]
}

export async function setTenantPlan(empresaId: number, planId: TenantPlanId) {
  if (!TENANT_PLAN_LIMITS[planId]) throw new Error("Plan inválido")
  await writePlanMetadata(empresaId, planId)
  return TENANT_PLAN_LIMITS[planId]
}

export async function contarSkusActivos(empresaId: number) {
  return db().suscripcionModulo.count({ where: { empresaId, activo: true } })
}

export async function validarLimiteActivacion(
  empresaId: number,
  opts?: { requiereSuperAdmin?: boolean; requierePlaybooks?: boolean; requiereImpersonacion?: boolean },
) {
  const [plan, activos] = await Promise.all([getTenantPlan(empresaId), contarSkusActivos(empresaId)])
  if (activos >= plan.maxSkusActivos) {
    throw new Error(`Límite del plan ${plan.id}: máximo ${plan.maxSkusActivos} SKUs activos`)
  }
  if (opts?.requiereSuperAdmin && !plan.superAdminPanel) {
    throw new Error(`Plan ${plan.id} no incluye panel Super Admin`)
  }
  if (opts?.requierePlaybooks && !plan.playbooksAuto) {
    throw new Error(`Plan ${plan.id} no incluye playbooks automáticos`)
  }
  if (opts?.requiereImpersonacion && !plan.impersonacionErp) {
    throw new Error(`Plan ${plan.id} no incluye impersonación ERP`)
  }
  return plan
}