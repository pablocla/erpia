import { prisma } from "@/lib/prisma"
import { getAnalystEmpresaScope } from "@/lib/auth/claver-analyst"
import { getEmpresaReadiness } from "@/lib/ops/readiness-service"
import { ANALYST_PLAYBOOKS } from "@/lib/ops/analyst-playbooks"
import { CLAVER_OPS_SERVICES } from "@/lib/ops/ops-services-catalog"
import { ensureTenantEntornos } from "@/lib/ops/ops-service"

function db() {
  return prisma as any
}

export async function getSuperAdminFleetDashboard(analystEmail: string) {
  const scope = await getAnalystEmpresaScope(analystEmail)
  const where = scope.mode === "assigned" ? { id: { in: scope.empresaIds } } : {}

  const empresas = await db().empresa.findMany({
    where,
    select: { id: true, nombre: true, rubro: true, planHosting: true },
    orderBy: { nombre: "asc" },
    take: 50,
  })

  const tenantRows = await Promise.all(
    empresas.map(async (e: { id: number; nombre: string; rubro: string; planHosting: string | null }) => {
      const [readiness, tareas, entornos, skusActivos] = await Promise.all([
        getEmpresaReadiness(e.id),
        db().marketplaceTareaAnalista.count({
          where: { empresaId: e.id, estado: { in: ["pendiente", "en_curso", "escalada"] } },
        }),
        ensureTenantEntornos(e.id),
        db().suscripcionModulo.count({ where: { empresaId: e.id, activo: true } }),
      ])
      const entornosError = entornos.filter((en: { estado: string }) => en.estado === "error").length
      return {
        id: e.id,
        nombre: e.nombre,
        rubro: e.rubro,
        planHosting: e.planHosting,
        readinessScore: readiness.score,
        listoGoLive: readiness.listoGoLive,
        tareasPendientes: tareas,
        skusActivos,
        entornosError,
      }
    }),
  )

  const totales = {
    tenants: tenantRows.length,
    readinessPromedio:
      tenantRows.length > 0
        ? Math.round(tenantRows.reduce((s, t) => s + t.readinessScore, 0) / tenantRows.length)
        : 0,
    listosGoLive: tenantRows.filter((t) => t.listoGoLive).length,
    tareasPendientes: tenantRows.reduce((s, t) => s + t.tareasPendientes, 0),
    entornosEnError: tenantRows.reduce((s, t) => s + t.entornosError, 0),
    skusActivosTotal: tenantRows.reduce((s, t) => s + t.skusActivos, 0),
  }

  return {
    scope: scope.mode,
    totales,
    tenants: tenantRows.sort((a, b) => a.readinessScore - b.readinessScore),
    playbooks: ANALYST_PLAYBOOKS,
    servicios: CLAVER_OPS_SERVICES,
  }
}