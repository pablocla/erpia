import { prisma } from "@/lib/prisma"
import { getAnalystEmpresaScope } from "@/lib/auth/claver-analyst"
import { getTenantBilling } from "@/lib/ops/tenant-billing-service"
import {
  diasDesde,
  getSignupMeta,
  ORIGEN_LABELS,
  type SignupOrigen,
} from "@/lib/ops/signup-tracking"

export interface WebRegistrationRow {
  empresaId: number
  nombre: string
  email: string | null
  cuit: string
  rubro: string
  modoLite: string
  createdAt: string
  diasDesdeAlta: number
  usuarioPrincipal: { nombre: string; email: string; createdAt: string } | null
  origen: SignupOrigen | null
  origenLabel: string
  origenDetalle: string | null
  demoIndustryId: string | null
  trial: {
    activo: boolean
    diasRestantes: number
    expirado: boolean
    expiresAt: string | null
  } | null
  skusActivos: number
  mrrArs: number
  esDemoCompartida: boolean
}

export interface WebRegistrationsResumen {
  total: number
  enTrial: number
  registrosWeb7d: number
  demos7d: number
  trialsPorVencer: number
}

function db() {
  return prisma as any
}

export async function listWebRegistrations(
  analystEmail: string,
  opts?: { take?: number; origen?: SignupOrigen },
): Promise<{ rows: WebRegistrationRow[]; resumen: WebRegistrationsResumen }> {
  const scope = await getAnalystEmpresaScope(analystEmail)
  const scopeWhere = scope.mode === "assigned" ? { id: { in: scope.empresaIds } } : {}
  const take = Math.min(opts?.take ?? 100, 200)

  const empresas = await db().empresa.findMany({
    where: { ...scopeWhere, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      nombre: true,
      email: true,
      cuit: true,
      rubro: true,
      modoLite: true,
      createdAt: true,
      usuarios: {
        where: { activo: true, rol: "administrador" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { nombre: true, email: true, createdAt: true },
      },
    },
  })

  const semana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const rows: WebRegistrationRow[] = await Promise.all(
    empresas.map(async (e: {
      id: number
      nombre: string
      email: string | null
      cuit: string
      rubro: string
      modoLite: string
      createdAt: Date
      usuarios: { nombre: string; email: string; createdAt: Date }[]
    }) => {
      const [meta, skusActivos, billing] = await Promise.all([
        getSignupMeta(e.id),
        db().suscripcionModulo.count({ where: { empresaId: e.id, activo: true } }),
        getTenantBilling(e.id).catch(() => ({ mrrTotalArs: 0 })),
      ])

      const admin = e.usuarios[0] ?? null
      const origen = meta.origen
      const origenLabel = origen ? ORIGEN_LABELS[origen] : "Sin etiqueta"

      return {
        empresaId: e.id,
        nombre: e.nombre,
        email: e.email ?? admin?.email ?? null,
        cuit: e.cuit,
        rubro: e.rubro,
        modoLite: e.modoLite,
        createdAt: e.createdAt.toISOString(),
        diasDesdeAlta: diasDesde(e.createdAt),
        usuarioPrincipal: admin
          ? {
              nombre: admin.nombre,
              email: admin.email,
              createdAt: admin.createdAt.toISOString(),
            }
          : null,
        origen,
        origenLabel,
        origenDetalle: meta.origenDetalle,
        demoIndustryId: meta.demoIndustryId,
        trial: meta.trial
          ? {
              activo: meta.trial.activo,
              diasRestantes: meta.trial.diasRestantes,
              expirado: meta.trial.expirado,
              expiresAt: meta.trial.expiresAt,
            }
          : null,
        skusActivos,
        mrrArs: billing.mrrTotalArs ?? 0,
        esDemoCompartida: e.cuit === "20-00000000-0",
      }
    }),
  )

  const filtered = opts?.origen ? rows.filter((r) => r.origen === opts.origen) : rows

  const resumen: WebRegistrationsResumen = {
    total: filtered.length,
    enTrial: filtered.filter((r) => r.trial?.activo).length,
    registrosWeb7d: filtered.filter(
      (r) => r.origen === "web_register" && new Date(r.createdAt) >= semana,
    ).length,
    demos7d: filtered.filter(
      (r) => r.origen === "industry_demo" && new Date(r.createdAt) >= semana,
    ).length,
    trialsPorVencer: filtered.filter((r) => r.trial?.activo && (r.trial?.diasRestantes ?? 0) <= 3).length,
  }

  return { rows: filtered, resumen }
}