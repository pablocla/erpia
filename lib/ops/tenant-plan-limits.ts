export type TenantPlanId = "Starter" | "Pro" | "Enterprise"

export interface TenantPlanLimits {
  id: TenantPlanId
  maxSkusActivos: number
  superAdminPanel: boolean
  playbooksAuto: boolean
  impersonacionErp: boolean
  playbooksCustom: boolean
  precioBaseArs: number
}

export const TENANT_PLAN_LIMITS: Record<TenantPlanId, TenantPlanLimits> = {
  Starter: {
    id: "Starter",
    maxSkusActivos: 5,
    superAdminPanel: false,
    playbooksAuto: false,
    impersonacionErp: false,
    playbooksCustom: false,
    precioBaseArs: 39_900,
  },
  Pro: {
    id: "Pro",
    maxSkusActivos: 25,
    superAdminPanel: true,
    playbooksAuto: true,
    impersonacionErp: true,
    playbooksCustom: false,
    precioBaseArs: 79_900,
  },
  Enterprise: {
    id: "Enterprise",
    maxSkusActivos: 999,
    superAdminPanel: true,
    playbooksAuto: true,
    impersonacionErp: true,
    playbooksCustom: true,
    precioBaseArs: 149_900,
  },
}