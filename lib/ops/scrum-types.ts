export const SCRUM_ESTADOS = ["backlog", "sprint", "en_curso", "review", "done"] as const
export type ScrumEstado = (typeof SCRUM_ESTADOS)[number]

export const BACKLOG_TIPOS = [
  "cca_hito",
  "marketplace_sku",
  "servicio_custom",
  "ticket_epic",
  "integracion",
] as const
export type BacklogTipo = (typeof BACKLOG_TIPOS)[number]

export interface ScrumSprint {
  id: string
  nombre: string
  inicio: string
  fin: string
  activo: boolean
}

export interface BacklogItem {
  id: string
  tipo: BacklogTipo
  titulo: string
  descripcion?: string
  estado: ScrumEstado
  visibilidadCliente: boolean
  storyPoints?: number
  asignadoA?: string
  vinculoRef?: string
  sprintId?: string
  orden: number
  createdAt: string
  updatedAt: string
}

export interface ScrumData {
  version: 1
  sprints: ScrumSprint[]
  items: BacklogItem[]
  updatedAt: string
  updatedBy?: string
}

export function buildScrumDataVacio(): ScrumData {
  return { version: 1, sprints: [], items: [], updatedAt: new Date().toISOString() }
}