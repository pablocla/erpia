import { prisma } from "@/lib/prisma"
import { listarMorososExpensas, type MorosoExpensaRow } from "@/lib/consorcios/consorcios-morosos-service"
import {
  obtenerOnboardingPropiedad,
  PROPIEDAD_ONBOARDING_STEPS,
  onboardingPropiedadPendiente,
  type PropiedadOnboardingStepId,
} from "@/lib/comercial/propiedad-onboarding"
import { PACK_PROPIEDAD } from "@/lib/comercial/hybrid-provision-bridge"
import { skusParaActivar } from "@/lib/comercial/pack-calle-catalog"

const RUBROS_PROPIEDAD = new Set(["inmobiliaria", "consorcios", "administracion_consorcios"])

function periodoActual(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export async function esTenantPropiedad(empresaId: number): Promise<boolean> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { rubro: true },
  })
  if (!empresa) return false
  if (RUBROS_PROPIEDAD.has(empresa.rubro)) return true

  const propiedadSkus = new Set(skusParaActivar(PACK_PROPIEDAD))
  const subs =
    (await prisma.suscripcionModulo.findMany({
      where: { empresaId, activo: true },
      select: { sku: true },
    })) ?? []
  return subs.some((s) => propiedadSkus.has(s.sku) || s.sku === "niche.consorcios")
}

export interface TenantConsorcioResumen {
  id: number
  nombre: string
  direccion: string
  unidades: number
  ultimoPeriodoLiquidado: string | null
  gastosPeriodoActual: number
}

export interface TenantPropiedadOverview {
  esPropiedad: boolean
  packId: string | null
  consorcios: TenantConsorcioResumen[]
  morosos: { total: number; items: MorosoExpensaRow[] }
  inmobiliaria: {
    propiedades: number
    contratosActivos: number
    contratosPorVencer30d: number
    alquileresSinFacturarMes: number
  }
  onboarding: {
    pendiente: boolean
    completados: number
    total: number
    pasos: {
      id: PropiedadOnboardingStepId
      label: string
      href: string
      hecho: boolean
    }[]
  }
  links: {
    consorcios: string
    inmobiliaria: string
    configuracion: string
  }
}

export async function getTenantPropiedadOverview(empresaId: number): Promise<TenantPropiedadOverview> {
  const esPropiedad = await esTenantPropiedad(empresaId)
  const periodo = periodoActual()

  const links = {
    consorcios: "/dashboard/nicho/consorcios",
    inmobiliaria: "/dashboard/nicho/inmobiliaria",
    configuracion: "/dashboard/configuracion",
  }

  if (!esPropiedad) {
    return {
      esPropiedad: false,
      packId: null,
      consorcios: [],
      morosos: { total: 0, items: [] },
      inmobiliaria: {
        propiedades: 0,
        contratosActivos: 0,
        contratosPorVencer30d: 0,
        alquileresSinFacturarMes: 0,
      },
      onboarding: {
        pendiente: false,
        completados: 0,
        total: PROPIEDAD_ONBOARDING_STEPS.length,
        pasos: PROPIEDAD_ONBOARDING_STEPS.map((p) => ({
          id: p.id,
          label: p.label,
          href: p.href,
          hecho: false,
        })),
      },
      links,
    }
  }

  const packSkus = skusParaActivar(PACK_PROPIEDAD)
  const subs = await prisma.suscripcionModulo.findMany({
    where: { empresaId, activo: true, sku: { in: packSkus } },
    select: { sku: true },
  })
  const packId = subs.length >= 2 ? PACK_PROPIEDAD : subs.some((s) => s.sku === "niche.consorcios") ? "niche.consorcios" : null

  const [consorciosRaw, morosos, propiedadesCount, contratosActivos, contratosPorVencer, contratosSinFacturar, onboardingState] =
    await Promise.all([
      prisma.consorcio.findMany({
        where: { empresaId },
        include: {
          _count: { select: { unidades: true } },
          unidades: {
            include: {
              expensas: {
                orderBy: { periodo: "desc" },
                take: 1,
                select: { periodo: true },
              },
            },
          },
        },
        orderBy: { nombre: "asc" },
      }),
      listarMorososExpensas(empresaId),
      prisma.propiedad.count({ where: { empresaId } }),
      prisma.contratoAlquiler.count({ where: { empresaId, estado: "activo" } }),
      prisma.contratoAlquiler.count({
        where: {
          empresaId,
          estado: "activo",
          fechaFin: { lte: new Date(Date.now() + 30 * 86_400_000) },
        },
      }),
      prisma.contratoAlquiler.count({
        where: {
          empresaId,
          estado: "activo",
          OR: [{ ultimoPeriodoFacturado: null }, { ultimoPeriodoFacturado: { not: periodo } }],
        },
      }),
      obtenerOnboardingPropiedad(empresaId),
    ])

  const consorcios: TenantConsorcioResumen[] = await Promise.all(
    consorciosRaw.map(async (c) => {
      const ultimoPeriodoLiquidado =
        c.unidades
          .flatMap((u) => u.expensas.map((e) => e.periodo))
          .sort()
          .pop() ?? null

      const gastosPeriodoActual = await prisma.consorcioGasto.count({
        where: { consorcioId: c.id, periodo },
      })

      return {
        id: c.id,
        nombre: c.nombre,
        direccion: c.direccion,
        unidades: c._count.unidades,
        ultimoPeriodoLiquidado,
        gastosPeriodoActual,
      }
    }),
  )

  const completados = onboardingState?.completados ?? []
  const pasos = PROPIEDAD_ONBOARDING_STEPS.map((p) => ({
    id: p.id,
    label: p.label,
    href: p.href,
    hecho: completados.includes(p.id),
  }))

  return {
    esPropiedad: true,
    packId,
    consorcios,
    morosos: { total: morosos.length, items: morosos.slice(0, 8) },
    inmobiliaria: {
      propiedades: propiedadesCount,
      contratosActivos,
      contratosPorVencer30d: contratosPorVencer,
      alquileresSinFacturarMes: contratosSinFacturar,
    },
    onboarding: {
      pendiente: onboardingPropiedadPendiente(onboardingState),
      completados: completados.length,
      total: PROPIEDAD_ONBOARDING_STEPS.length,
      pasos,
    },
    links,
  }
}

/** KPIs fleet para command center */
export async function getPropiedadFleetKpis(empresaIds?: number[]) {
  const whereEmpresa = empresaIds?.length ? { id: { in: empresaIds } } : {}

  const empresas = await prisma.empresa.findMany({
    where: {
      ...whereEmpresa,
      OR: [
        { rubro: { in: [...RUBROS_PROPIEDAD] } },
        {
          suscripciones: {
            some: { activo: true, sku: { in: ["niche.consorcios", "niche.inmo_garantia"] } },
          },
        },
      ],
    },
    select: { id: true },
  })

  const ids = empresas.map((e) => e.id)
  if (ids.length === 0) {
    return {
      tenantsPropiedad: 0,
      sinLiquidarMes: 0,
      checklistIncompleto: 0,
      morososActivos: 0,
    }
  }

  const periodo = periodoActual()
  let sinLiquidarMes = 0
  let checklistIncompleto = 0
  let morososActivos = 0

  await Promise.all(
    ids.map(async (empresaId) => {
      const [consorcios, onboarding, morosos] = await Promise.all([
        prisma.consorcio.findMany({
          where: { empresaId },
          select: {
            id: true,
            unidades: {
              select: {
                expensas: { where: { periodo }, take: 1, select: { id: true } },
              },
            },
          },
        }),
        obtenerOnboardingPropiedad(empresaId),
        listarMorososExpensas(empresaId),
      ])

      const tieneConsorcio = consorcios.length > 0
      const liquidoEsteMes = consorcios.some((c) =>
        c.unidades.some((u) => u.expensas.length > 0),
      )
      if (tieneConsorcio && !liquidoEsteMes) sinLiquidarMes++

      if (onboardingPropiedadPendiente(onboarding)) checklistIncompleto++
      if (morosos.length > 0) morososActivos++
    }),
  )

  return {
    tenantsPropiedad: ids.length,
    sinLiquidarMes,
    checklistIncompleto,
    morososActivos,
  }
}