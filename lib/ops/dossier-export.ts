import { getEmpresaReadiness } from "@/lib/ops/readiness-service"
import { getProyectoImplementacion } from "@/lib/ops/implementacion-service"
import { prisma } from "@/lib/prisma"

export async function exportDossierJson(proyectoId: number) {
  const db = prisma as any
  const proyecto = await getProyectoImplementacion(proyectoId)
  if (!proyecto) return null

  const [actas, asignaciones, entornos, readiness] = await Promise.all([
    db.actaImplementacion.findMany({
      where: { proyectoId },
      orderBy: { createdAt: "desc" },
    }),
    db.analistaAsignacion.findMany({
      where: { empresaId: proyecto.empresaId, activo: true },
    }),
    db.tenantEntorno.findMany({
      where: { empresaId: proyecto.empresaId },
      select: { codigo: true, estado: true, urlBase: true, version: true },
    }),
    getEmpresaReadiness(proyecto.empresaId),
  ])

  return {
    exportadoEn: new Date().toISOString(),
    formato: "claver-cloud-dossier-v1",
    proyecto: {
      id: proyecto.id,
      codigo: proyecto.codigo,
      estado: proyecto.estado,
      faseActual: proyecto.faseActual,
      porcentajeAvance: proyecto.porcentajeAvance,
      planComercial: proyecto.planComercial,
      analistaEmail: proyecto.analistaEmail,
      fechas: {
        venta: proyecto.fechaVenta,
        kickoff: proyecto.fechaKickoff,
        objetivoGoLive: proyecto.fechaObjetivoGoLive,
        goLiveReal: proyecto.fechaGoLiveReal,
      },
      fases: proyecto.fases,
      packOnboardEntregado: proyecto.packOnboardEntregado,
      urlAcceso: proyecto.urlAcceso,
      notas: proyecto.notas,
    },
    empresa: proyecto.empresa,
    entornos,
    analistas: asignaciones.map((a: { analistaEmail: string; rolAsignacion: string }) => ({
      email: a.analistaEmail,
      rol: a.rolAsignacion,
    })),
    actas,
    readiness,
  }
}