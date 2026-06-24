export const SLA_HORAS: Record<string, number> = {
  critica: 4,
  alta: 8,
  media: 24,
  baja: 72,
}

export type TicketLite = {
  estado: string
  prioridad: string
  modulo: string | null
  createdAt: Date
  resolvedAt: Date | null
  empresaId?: number
}

export type TicketListFilters = {
  empresaId?: number
  estado?: string | null
  prioridad?: string | null
  modulo?: string | null
  q?: string | null
}

export function horasEntre(inicio: Date, fin: Date) {
  return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60)
}

export function horasAbierto(fechaIso: string | Date) {
  const inicio = typeof fechaIso === "string" ? new Date(fechaIso) : fechaIso
  return Math.max(0, horasEntre(inicio, new Date()))
}

export function estaVencidoSla(estado: string, prioridad: string, createdAt: Date) {
  if (!["abierto", "en_progreso"].includes(estado)) return false
  const limite = SLA_HORAS[prioridad] ?? SLA_HORAS.media
  return horasEntre(createdAt, new Date()) > limite
}

export function buildTicketWhere(filters: TicketListFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {}
  if (filters.empresaId) where.empresaId = filters.empresaId
  if (filters.estado) where.estado = filters.estado
  if (filters.prioridad) where.prioridad = filters.prioridad
  if (filters.modulo) where.modulo = filters.modulo
  if (filters.q) {
    where.OR = [
      { numero: { contains: filters.q, mode: "insensitive" } },
      { titulo: { contains: filters.q, mode: "insensitive" } },
      { descripcion: { contains: filters.q, mode: "insensitive" } },
      { reportadoPor: { contains: filters.q, mode: "insensitive" } },
    ]
  }
  return where
}

export function computeTicketMetricas(tickets: TicketLite[]) {
  const ahora = new Date()
  const abiertos = tickets.filter((t) => t.estado === "abierto" || t.estado === "en_progreso")
  const criticosAbiertos = abiertos.filter((t) => t.prioridad === "critica").length

  let vencidosSla = 0
  for (const t of abiertos) {
    if (estaVencidoSla(t.estado, t.prioridad, t.createdAt)) vencidosSla += 1
  }

  const cerradosConResolucion = tickets.filter(
    (t) => (t.estado === "resuelto" || t.estado === "cerrado") && t.resolvedAt,
  )
  const mttrHoras =
    cerradosConResolucion.length > 0
      ? cerradosConResolucion.reduce((acc, t) => acc + horasEntre(t.createdAt, t.resolvedAt as Date), 0) /
        cerradosConResolucion.length
      : 0

  const porModulo = tickets.reduce<Record<string, number>>((acc, t) => {
    const key = t.modulo?.trim() || "general"
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const modulos = Object.entries(porModulo)
    .map(([modulo, total]) => ({ modulo, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)

  const porEmpresa = tickets.reduce<Record<number, number>>((acc, t) => {
    if (t.empresaId == null) return acc
    acc[t.empresaId] = (acc[t.empresaId] || 0) + 1
    return acc
  }, {})

  const empresas = Object.entries(porEmpresa)
    .map(([empresaId, total]) => ({ empresaId: Number(empresaId), total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)

  return {
    resumen: {
      total: tickets.length,
      abiertos: abiertos.length,
      enProgreso: tickets.filter((t) => t.estado === "en_progreso").length,
      resueltos: tickets.filter((t) => t.estado === "resuelto").length,
      cerrados: tickets.filter((t) => t.estado === "cerrado").length,
      criticosAbiertos,
      vencidosSla,
      mttrHoras: Number(mttrHoras.toFixed(2)),
    },
    modulos,
    empresas,
    generadoAt: ahora.toISOString(),
  }
}