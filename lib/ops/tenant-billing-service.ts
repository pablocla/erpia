import { prisma } from "@/lib/prisma"
import { getAnalystEmpresaScope } from "@/lib/auth/claver-analyst"
import { getTenantPlan, TENANT_PLAN_LIMITS, type TenantPlanId } from "@/lib/ops/tenant-plan-service"

function db() {
  return prisma as any
}

export interface TenantBillingRow {
  empresaId: number
  nombre: string
  plan: TenantPlanId
  mrrSkusArs: number
  mrrPlanArs: number
  mrrTotalArs: number
  skusActivos: number
  limiteSkus: number
  opsSuperAdmin: boolean
}

export async function getTenantBilling(empresaId: number): Promise<TenantBillingRow> {
  const [empresa, plan, subs] = await Promise.all([
    db().empresa.findUnique({ where: { id: empresaId }, select: { id: true, nombre: true } }),
    getTenantPlan(empresaId),
    db().suscripcionModulo.findMany({
      where: { empresaId, activo: true },
      select: { sku: true },
    }),
  ])
  if (!empresa) throw new Error("Empresa no encontrada")

  const skus = subs.map((s: { sku: string }) => s.sku)
  const comerciales = await db().productoComercial.findMany({
    where: { sku: { in: skus } },
    select: { sku: true, precioArs: true },
  })
  const precioMap = new Map(comerciales.map((p: { sku: string; precioArs: number }) => [p.sku, p.precioArs]))
  const mrrSkus = skus.reduce((sum: number, sku: string) => sum + (precioMap.get(sku) ?? 0), 0)
  const opsSuperAdmin = skus.includes("ops.claver_superadmin")

  return {
    empresaId,
    nombre: empresa.nombre,
    plan: plan.id,
    mrrSkusArs: mrrSkus,
    mrrPlanArs: plan.precioBaseArs,
    mrrTotalArs: mrrSkus + plan.precioBaseArs,
    skusActivos: skus.length,
    limiteSkus: plan.maxSkusActivos,
    opsSuperAdmin,
  }
}

export async function getFleetBilling(analystEmail: string) {
  const scope = await getAnalystEmpresaScope(analystEmail)
  const where = scope.mode === "assigned" ? { id: { in: scope.empresaIds } } : {}

  const empresas = await db().empresa.findMany({
    where,
    select: { id: true },
    orderBy: { nombre: "asc" },
  })

  const rows = await Promise.all(empresas.map((e: { id: number }) => getTenantBilling(e.id)))
  const mrrTotal = rows.reduce((s, r) => s + r.mrrTotalArs, 0)

  return {
    planes: TENANT_PLAN_LIMITS,
    rows,
    totales: {
      tenants: rows.length,
      mrrTotalArs: mrrTotal,
      conSuperAdmin: rows.filter((r) => r.opsSuperAdmin).length,
    },
  }
}