import { prisma } from "@/lib/prisma"

/* ═══════════════════════════════════════════════════════════════════════════
   GESTIÓN DE CALIDAD — Inspecciones en recepción y producción
   Equivalente a SAP QM + Bejerman Calidad + ISO 9001
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Crear plantilla de inspección ──────────────────────────────────────────

export async function crearPlantilla(params: {
  empresaId: number
  nombre: string
  entidad: string
  criterios: Array<{
    nombre: string
    tipo: string
    valorMinimo?: number
    valorMaximo?: number
    obligatorio?: boolean
  }>
}) {
  return prisma.plantillaInspeccion.create({
    data: {
      nombre: params.nombre,
      entidad: params.entidad,
      empresaId: params.empresaId,
      criterios: {
        create: params.criterios.map((c, i) => ({
          nombre: c.nombre,
          tipo: c.tipo,
          valorMinimo: c.valorMinimo,
          valorMaximo: c.valorMaximo,
          obligatorio: c.obligatorio ?? true,
          orden: i + 1,
        })),
      },
    },
    include: { criterios: true },
  })
}

// ─── Iniciar inspección ─────────────────────────────────────────────────────

export async function iniciarInspeccion(params: {
  empresaId: number
  plantillaId: number
  entidad: string
  entidadId: number
  inspectorId: number
}) {
  return prisma.inspeccionCalidad.create({
    data: {
      plantillaId: params.plantillaId,
      entidad: params.entidad,
      entidadId: params.entidadId,
      estado: "en_curso",
      inspectorId: params.inspectorId,
      empresaId: params.empresaId,
    },
    include: { resultados: true },
  })
}

// ─── Registrar resultados ───────────────────────────────────────────────────

export async function registrarResultados(params: {
  inspeccionId: number
  resultados: Array<{
    criterioId: number
    valorTexto?: string
    valorNumerico?: number
    valorBooleano?: boolean
    conforme: boolean
    observacion?: string
  }>
}) {
  const data = params.resultados.map((r) => ({
    inspeccionId: params.inspeccionId,
    criterioId: r.criterioId,
    valorTexto: r.valorTexto,
    valorNumerico: r.valorNumerico,
    valorBooleano: r.valorBooleano,
    conforme: r.conforme,
    observacion: r.observacion,
  }))

  await prisma.resultadoInspeccion.createMany({ data })

  // Evaluar resultado global
  const todosConformes = params.resultados.every((r) => r.conforme)
  const algunoNoConforme = params.resultados.some((r) => !r.conforme)

  let estado: string
  if (todosConformes) {
    estado = "aprobada"
  } else if (algunoNoConforme) {
    // Si hay no-conformes pero no son obligatorios, aprobada con desvío
    const criterios = await prisma.criterioInspeccion.findMany({
      where: { id: { in: params.resultados.filter((r) => !r.conforme).map((r) => r.criterioId) } },
    })
    const tieneObligatorioFallido = criterios.some((c) => c.obligatorio)
    estado = tieneObligatorioFallido ? "rechazada" : "aprobada_con_desvio"
  } else {
    estado = "aprobada"
  }

  await prisma.inspeccionCalidad.update({
    where: { id: params.inspeccionId },
    data: { estado, completadaAt: new Date() },
  })

  return { estado }
}

// ─── Listar inspecciones por entidad ────────────────────────────────────────

export async function listarInspecciones(empresaId: number, filtros?: {
  entidad?: string
  estado?: string
}) {
  const where: Record<string, unknown> = { empresaId }
  if (filtros?.entidad) where.entidad = filtros.entidad
  if (filtros?.estado) where.estado = filtros.estado

  return prisma.inspeccionCalidad.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { resultados: true },
  })
}

// ─── Métricas de calidad ────────────────────────────────────────────────────

export async function metricasCalidad(empresaId: number) {
  const hace30d = new Date()
  hace30d.setDate(hace30d.getDate() - 30)

  const inspecciones = await prisma.inspeccionCalidad.findMany({
    where: { empresaId, createdAt: { gte: hace30d } },
  })

  const total = inspecciones.length
  const aprobadas = inspecciones.filter((i) => i.estado === "aprobada").length
  const rechazadas = inspecciones.filter((i) => i.estado === "rechazada").length
  const conDesvio = inspecciones.filter((i) => i.estado === "aprobada_con_desvio").length
  const tasaAprobacion = total > 0 ? Math.round((aprobadas / total) * 100) : 0

  return { total, aprobadas, rechazadas, conDesvio, tasaAprobacion }
}
