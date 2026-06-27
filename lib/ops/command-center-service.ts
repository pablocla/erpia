import { prisma } from "@/lib/prisma"
import { getAnalystEmpresaScope } from "@/lib/auth/claver-analyst"
import { getPlataformaMetricas } from "@/lib/ops/ops-metrics-service"
import { getFleetBilling } from "@/lib/ops/tenant-billing-service"
import { getSuperAdminFleetDashboard } from "@/lib/ops/superadmin-dashboard-service"
import { getMetricasTorreImplementacion } from "@/lib/ops/implementacion-service"
import { getPipelineResumen, listComercialLeads } from "@/lib/ops/comercial-pipeline-service"
import { countRelevamientosSemana } from "@/lib/ops/comercial-relevamiento-service"
import { getCeoRoadmapState } from "@/lib/ops/ceo-task-service"
import { generarCeoAlerts } from "@/lib/ops/ceo-alerts-service"
import { computeFocoHoy } from "@/lib/ops/ceo-focus-service"
import { CEO_METAS_F1, CEO_RUTINA_DIARIA } from "@/lib/ops/ceo-roadmap-catalog"

function db() {
  return prisma as any
}

const WEEK_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

function contarClientesPagos(
  leads: { etapa: string }[],
): number {
  return leads.filter((l) => l.etapa === "cerrado" || l.etapa === "provisionado").length
}

export async function getCommandCenter(analystEmail: string) {
  const scope = await getAnalystEmpresaScope(analystEmail)
  const empresaIds = scope.mode === "assigned" ? scope.empresaIds : undefined

  const [metricas, fleet, billing, implementacion, pipelineResumen, leads] = await Promise.all([
    getPlataformaMetricas(analystEmail),
    getSuperAdminFleetDashboard(analystEmail),
    getFleetBilling(analystEmail),
    getMetricasTorreImplementacion(empresaIds),
    getPipelineResumen().catch(() => ({
      activos: 0,
      valorPipelineArs: 0,
      porEtapa: {} as Record<string, { count: number; valor: number }>,
      proximasAcciones: [] as {
        id: number
        nombre: string
        negocio: string | null
        etapa: string
        proximaAccion: string | null
        proximaFecha: string | null
      }[],
    })),
    listComercialLeads().catch(() => []),
  ])

  const clientesPagos = contarClientesPagos(leads)
  const relevamientosSemana = await countRelevamientosSemana().catch(() => 0)
  const leadsEnTrial = leads.filter((l) => l.etapa === "trial").length
  const semana = WEEK_AGO()
  const leadsVisitaSemana = leads.filter(
    (l) => l.etapa !== "descartado" && new Date(l.createdAt) >= semana,
  ).length

  const followupsVencidos = leads.filter(
    (l) =>
      l.proximaFecha &&
      new Date(l.proximaFecha) < new Date() &&
      !["descartado", "provisionado"].includes(l.etapa),
  )

  const roadmap = await getCeoRoadmapState(analystEmail, clientesPagos).catch(() => ({
    faseActual: "f0" as const,
    fases: [],
    tareas: [],
    pendientes: [],
    completadas: 0,
    total: 0,
  }))

  const setupCompleto = roadmap.fases.find((f) => f.id === "f0")?.porcentaje === 100

  const alerts = generarCeoAlerts({
    clientesPagos,
    pipelineActivos: pipelineResumen.activos,
    leadsEnTrial,
    leadsVisitaSemana,
    followupsVencidos: followupsVencidos.length,
    entornosEnError: metricas.entornosEnError,
    setupCompleto,
    tareasCriticasPendientes: roadmap.pendientes.filter((t) => t.prioridad === "critica"),
    faseActual: roadmap.faseActual,
    mrrTotalArs: billing.totales.mrrTotalArs,
  })

  const focoHoy = computeFocoHoy({
    tareasPendientes: roadmap.pendientes,
    alerts,
    followupsVencidos: followupsVencidos.map((l) => ({ id: l.id, nombre: l.nombre })),
    clientesPagos,
  })

  let ordenesRecientes: {
    id: number
    razonSocial: string
    estado: string
    createdAt: string
    empresaId?: number
  }[] = []

  try {
    const ordenes = await db().ordenProvision.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        razonSocial: true,
        estado: true,
        createdAt: true,
        empresaId: true,
      },
    })
    ordenesRecientes = ordenes.map((o: Record<string, unknown>) => ({
      id: o.id as number,
      razonSocial: o.razonSocial as string,
      estado: o.estado as string,
      createdAt: new Date(o.createdAt as string).toISOString(),
      empresaId: (o.empresaId as number | undefined) ?? undefined,
    }))
  } catch {
    ordenesRecientes = []
  }

  const tenantsEnRiesgo = fleet.tenants
    .filter((t) => t.entornosError > 0 || !t.listoGoLive || t.tareasPendientes > 3)
    .slice(0, 6)

  return {
    generadoAt: new Date().toISOString(),
    operador: analystEmail,
    scope: scope.mode,
    kpis: {
      mrrTotalArs: billing.totales.mrrTotalArs,
      tenants: billing.totales.tenants,
      clientesPagos,
      entornosEnError: metricas.entornosEnError,
      slaVencidos: metricas.slaVencidos,
      mttrHoras: metricas.mttrHoras,
      readinessPromedio: fleet.totales.readinessPromedio,
      listosGoLive: fleet.totales.listosGoLive,
      tareasMarketplace: fleet.totales.tareasPendientes,
      implementacionActivos: implementacion.activos,
      implementacionAtrasados: implementacion.atrasados,
      pipelineActivos: pipelineResumen.activos,
      valorPipelineArs: pipelineResumen.valorPipelineArs,
      leadsEnTrial,
      visitasSemana: leadsVisitaSemana,
      relevamientosSemana,
    },
    mando: {
      focoHoy,
      alerts,
      roadmap,
      rutinaDiaria: CEO_RUTINA_DIARIA,
      metasF1: {
        ...CEO_METAS_F1,
        progreso: {
          visitasSemana: leadsVisitaSemana,
          trials: leadsEnTrial,
          conversiones: clientesPagos,
        },
      },
    },
    comercial: {
      resumen: pipelineResumen,
      leads,
    },
    operaciones: {
      ordenesRecientes,
      tenantsEnRiesgo,
      implementacion,
    },
    recursos: [
      {
        titulo: "Relevamiento de visita",
        href: "/claver-cloud/comercial/relevamientos",
        descripcion: "Cargar devolución del local después de cada visita",
      },
      {
        titulo: "Playbook vendedor en calle",
        href: "/dashboard/documentacion/comercial/roadmap-venta-vendedor",
        descripcion: "Speech, visitas retail y roadmap monotributo",
      },
      {
        titulo: "Nueva organización",
        href: "/claver-cloud/provisioning/new",
        descripcion: "Provisionar tenant tras cerrar venta",
      },
      {
        titulo: "Enganches comerciales",
        href: "/dashboard/documentacion/marketplace/12-enganches-comerciales",
        descripcion: "Precios y paquetes del marketplace",
      },
      {
        titulo: "Sitio comercial Claver",
        href: "/claver",
        descripcion: "Landing matriz y ecommerce",
      },
    ],
  }
}