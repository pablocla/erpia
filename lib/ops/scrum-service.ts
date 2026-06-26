import { prisma } from "@/lib/prisma"
import { buildFasesIniciales, CCA_FASES, type FasesMap } from "@/lib/ops/implementacion-types"
import {
  buildScrumDataVacio,
  type BacklogItem,
  type BacklogTipo,
  type ScrumData,
  type ScrumEstado,
} from "@/lib/ops/scrum-types"

function db() {
  return prisma as any
}

function parseFases(raw: unknown): FasesMap {
  const base = buildFasesIniciales()
  if (!raw || typeof raw !== "object") return base
  const input = raw as FasesMap
  for (const f of CCA_FASES) {
    if (input[f.codigo]) base[f.codigo] = input[f.codigo]
  }
  return base
}

function parseScrum(raw: unknown): ScrumData {
  if (!raw || typeof raw !== "object") return buildScrumDataVacio()
  const d = raw as ScrumData
  return {
    version: 1,
    sprints: Array.isArray(d.sprints) ? d.sprints : [],
    items: Array.isArray(d.items) ? d.items : [],
    updatedAt: d.updatedAt ?? new Date().toISOString(),
    updatedBy: d.updatedBy,
  }
}

async function loadProyecto(empresaId: number) {
  const proyecto = await db().proyectoImplementacion.findUnique({ where: { empresaId } })
  if (!proyecto) throw new Error("Proyecto de implementación no encontrado")
  return proyecto
}

async function saveScrum(empresaId: number, scrum: ScrumData, updatedBy: string) {
  const proyecto = await loadProyecto(empresaId)
  const metadata = (proyecto.metadata && typeof proyecto.metadata === "object"
    ? proyecto.metadata
    : {}) as Record<string, unknown>
  const next: ScrumData = { ...scrum, updatedAt: new Date().toISOString(), updatedBy }
  await db().proyectoImplementacion.update({
    where: { empresaId },
    data: { metadata: { ...metadata, scrum: next }, updatedAt: new Date() },
  })
  return next
}

export async function getScrumData(empresaId: number): Promise<ScrumData> {
  const proyecto = await db().proyectoImplementacion.findUnique({
    where: { empresaId },
    select: { metadata: true },
  })
  if (!proyecto) return buildScrumDataVacio()
  const meta = proyecto.metadata as Record<string, unknown> | null
  return parseScrum(meta?.scrum)
}

export async function listBacklogStakeholder(empresaId: number) {
  const scrum = await getScrumData(empresaId)
  return scrum.items
    .filter((i) => i.visibilidadCliente)
    .sort((a, b) => a.orden - b.orden)
}

export async function crearBacklogItem(
  empresaId: number,
  input: {
    tipo: BacklogTipo
    titulo: string
    descripcion?: string
    visibilidadCliente?: boolean
    storyPoints?: number
    asignadoA?: string
    vinculoRef?: string
    estado?: ScrumEstado
  },
  actorEmail: string,
): Promise<BacklogItem> {
  const scrum = await getScrumData(empresaId)
  const item: BacklogItem = {
    id: `bl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tipo: input.tipo,
    titulo: input.titulo,
    descripcion: input.descripcion,
    estado: input.estado ?? "backlog",
    visibilidadCliente: input.visibilidadCliente ?? true,
    storyPoints: input.storyPoints,
    asignadoA: input.asignadoA,
    vinculoRef: input.vinculoRef,
    orden: scrum.items.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  scrum.items.push(item)
  await saveScrum(empresaId, scrum, actorEmail)
  return item
}

export async function moverBacklogItem(
  empresaId: number,
  itemId: string,
  estado: ScrumEstado,
  actorEmail: string,
): Promise<BacklogItem> {
  const scrum = await getScrumData(empresaId)
  const idx = scrum.items.findIndex((i) => i.id === itemId)
  if (idx < 0) throw new Error("Ítem de backlog no encontrado")
  scrum.items[idx] = {
    ...scrum.items[idx],
    estado,
    updatedAt: new Date().toISOString(),
  }
  await saveScrum(empresaId, scrum, actorEmail)
  return scrum.items[idx]
}

/** Sincroniza ítems desde CCA, marketplace y tickets abiertos (sin duplicar vinculoRef). */
export async function sincronizarBacklogDesdeFuentes(empresaId: number, actorEmail: string) {
  const scrum = await getScrumData(empresaId)
  const existentes = new Set(scrum.items.map((i) => `${i.tipo}:${i.vinculoRef ?? i.titulo}`))
  const nuevos: BacklogItem[] = []

  const proyecto = await db().proyectoImplementacion.findUnique({ where: { empresaId } })
  if (proyecto?.fases) {
    const fases = parseFases(proyecto.fases)
    for (const f of CCA_FASES) {
      const key = `cca_hito:${f.codigo}`
      if (existentes.has(key)) continue
      const st = fases[f.codigo]
      nuevos.push({
        id: `bl-cca-${f.codigo}`,
        tipo: "cca_hito",
        titulo: `${f.codigo} — ${f.nombre}`,
        estado: st?.completado ? "done" : proyecto.faseActual === f.codigo ? "en_curso" : "backlog",
        visibilidadCliente: true,
        vinculoRef: f.codigo,
        orden: scrum.items.length + nuevos.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      existentes.add(key)
    }
  }

  const tareas = await db().marketplaceTareaAnalista.findMany({
    where: { empresaId, estado: { in: ["pendiente", "en_curso", "escalada"] } },
    take: 30,
  })
  for (const t of tareas) {
    const key = `marketplace_sku:${t.sku}`
    if (existentes.has(key)) continue
    nuevos.push({
      id: `bl-mkt-${t.id}`,
      tipo: "marketplace_sku",
      titulo: t.titulo ?? `Activar ${t.sku}`,
      estado: t.estado === "en_curso" ? "en_curso" : "sprint",
      visibilidadCliente: true,
      vinculoRef: t.sku,
      asignadoA: t.asignadoA,
      orden: scrum.items.length + nuevos.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    existentes.add(key)
  }

  const tickets = await db().ticket.findMany({
    where: { empresaId, estado: { in: ["abierto", "en_progreso"] } },
    take: 20,
  })
  for (const tk of tickets) {
    const key = `ticket_epic:${tk.numero}`
    if (existentes.has(key)) continue
    nuevos.push({
      id: `bl-tk-${tk.id}`,
      tipo: "ticket_epic",
      titulo: `${tk.numero} — ${tk.titulo}`,
      estado: tk.estado === "en_progreso" ? "en_curso" : "backlog",
      visibilidadCliente: tk.prioridad !== "critica" || true,
      vinculoRef: tk.numero,
      orden: scrum.items.length + nuevos.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    existentes.add(key)
  }

  if (nuevos.length === 0) return scrum

  scrum.items = [...scrum.items, ...nuevos]
  return saveScrum(empresaId, scrum, actorEmail)
}

export async function crearSprint(
  empresaId: number,
  input: { nombre: string; inicio: string; fin: string; activo?: boolean },
  actorEmail: string,
) {
  const scrum = await getScrumData(empresaId)
  const sprint = {
    id: `sp-${Date.now()}`,
    nombre: input.nombre,
    inicio: input.inicio,
    fin: input.fin,
    activo: input.activo ?? true,
  }
  if (sprint.activo) {
    scrum.sprints = scrum.sprints.map((s) => ({ ...s, activo: false }))
  }
  scrum.sprints.push(sprint)
  return saveScrum(empresaId, scrum, actorEmail)
}

export async function asignarItemASprint(
  empresaId: number,
  itemId: string,
  sprintId: string | null,
  actorEmail: string,
) {
  const scrum = await getScrumData(empresaId)
  const idx = scrum.items.findIndex((i) => i.id === itemId)
  if (idx < 0) throw new Error("Ítem de backlog no encontrado")
  scrum.items[idx] = {
    ...scrum.items[idx],
    sprintId: sprintId ?? undefined,
    estado: sprintId ? "sprint" : scrum.items[idx].estado,
    updatedAt: new Date().toISOString(),
  }
  await saveScrum(empresaId, scrum, actorEmail)
  return scrum.items[idx]
}

export function getSprintActivo(scrum: ScrumData) {
  return scrum.sprints.find((s) => s.activo) ?? scrum.sprints[scrum.sprints.length - 1] ?? null
}

export async function getScrumResumenStakeholder(empresaId: number) {
  const scrum = await getScrumData(empresaId)
  const sprintActivo = getSprintActivo(scrum)
  return {
    sprintActivo,
    items: scrum.items.filter((i) => i.visibilidadCliente).sort((a, b) => a.orden - b.orden),
  }
}