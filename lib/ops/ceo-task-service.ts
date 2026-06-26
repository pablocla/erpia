import { prisma } from "@/lib/prisma"
import {
  CEO_FASES,
  CEO_TAREAS,
  getTareaByCodigo,
  type CeoFaseId,
  type CeoTaskDef,
} from "@/lib/ops/ceo-roadmap-catalog"

function db() {
  return prisma as any
}

export type CeoTareaEnriquecida = CeoTaskDef & {
  completada: boolean
  completadaAt: string | null
  bloqueada: boolean
  bloqueadaRazon: string | null
  disponible: boolean
}

export async function getProgresoMap(operador: string): Promise<Map<string, { completada: boolean; completadaAt: Date | null }>> {
  const rows = await db().ceoTareaProgreso.findMany({
    where: { operador: operador.trim().toLowerCase() },
  })
  return new Map(
    rows.map((r: { taskCodigo: string; completada: boolean; completadaAt: Date | null }) => [
      r.taskCodigo,
      { completada: r.completada, completadaAt: r.completadaAt },
    ]),
  )
}

export function enriquecerTareas(
  progreso: Map<string, { completada: boolean; completadaAt: Date | null }>,
  clientesPagos: number,
): CeoTareaEnriquecida[] {
  const completadas = new Set(
    [...progreso.entries()].filter(([, v]) => v.completada).map(([k]) => k),
  )

  return CEO_TAREAS.map((tarea) => {
    const prog = progreso.get(tarea.codigo)
    const completada = prog?.completada ?? false

    let bloqueada = false
    let bloqueadaRazon: string | null = null

    if (tarea.requiere && !completadas.has(tarea.requiere)) {
      bloqueada = true
      const prereq = getTareaByCodigo(tarea.requiere)
      bloqueadaRazon = prereq ? `Completá primero: ${prereq.titulo}` : "Prerequisito pendiente"
    }

    if (tarea.requiereClientesPagos != null && clientesPagos < tarea.requiereClientesPagos) {
      bloqueada = true
      bloqueadaRazon = `Requiere ${tarea.requiereClientesPagos} clientes pagos (tenés ${clientesPagos})`
    }

    const disponible = !bloqueada && !completada

    return {
      ...tarea,
      completada,
      completadaAt: prog?.completadaAt ? prog.completadaAt.toISOString() : null,
      bloqueada,
      bloqueadaRazon,
      disponible,
    }
  })
}

export function calcularFaseActual(tareas: CeoTareaEnriquecida[]): CeoFaseId {
  for (const fase of CEO_FASES.filter((f) => f.id !== "mkt").sort((a, b) => a.orden - b.orden)) {
    const tareasFase = tareas.filter((t) => t.fase === fase.id && !t.diferida)
    const pendientes = tareasFase.filter((t) => !t.completada && !t.bloqueada)
    if (pendientes.length > 0 || tareasFase.some((t) => !t.completada)) {
      return fase.id
    }
  }
  return "f3"
}

export function progresoPorFase(tareas: CeoTareaEnriquecida[]) {
  return CEO_FASES.map((fase) => {
    const delaFase = tareas.filter((t) => t.fase === fase.id)
    const total = delaFase.length
    const hechas = delaFase.filter((t) => t.completada).length
    return {
      ...fase,
      total,
      hechas,
      porcentaje: total > 0 ? Math.round((hechas / total) * 100) : 0,
    }
  })
}

export async function toggleCeoTarea(
  operador: string,
  taskCodigo: string,
  completada: boolean,
): Promise<void> {
  const email = operador.trim().toLowerCase()
  await db().ceoTareaProgreso.upsert({
    where: { operador_taskCodigo: { operador: email, taskCodigo } },
    create: {
      operador: email,
      taskCodigo,
      completada,
      completadaAt: completada ? new Date() : null,
    },
    update: {
      completada,
      completadaAt: completada ? new Date() : null,
    },
  })
}

export async function getCeoRoadmapState(operador: string, clientesPagos: number) {
  const progreso = await getProgresoMap(operador).catch(() => new Map())
  const tareas = enriquecerTareas(progreso, clientesPagos)
  const faseActual = calcularFaseActual(tareas)
  const fases = progresoPorFase(tareas)

  return {
    faseActual,
    fases,
    tareas,
    pendientes: tareas.filter((t) => t.disponible).sort((a, b) => {
      const prio = { critica: 0, alta: 1, media: 2, baja: 3 }
      return prio[a.prioridad] - prio[b.prioridad]
    }),
    completadas: tareas.filter((t) => t.completada).length,
    total: tareas.length,
  }
}