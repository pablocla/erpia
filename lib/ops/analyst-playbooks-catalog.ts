export type PlaybookRiesgo = "bajo" | "medio" | "alto"
export type PlaybookCategoria = "activacion" | "ops" | "implementacion" | "postventa" | "diagnostico"

export interface AnalystPlaybook {
  id: string
  nombre: string
  descripcion: string
  categoria: PlaybookCategoria
  riesgo: PlaybookRiesgo
  duracionEstimada: string
  servicioSku: "ops.claver_superadmin"
}

export const ANALYST_PLAYBOOKS: AnalystPlaybook[] = [
  {
    id: "diagnostico_readiness",
    nombre: "Diagnóstico go-live",
    descripcion: "Calcula readiness score y lista bloqueos sin modificar datos.",
    categoria: "diagnostico",
    riesgo: "bajo",
    duracionEstimada: "< 5 s",
    servicioSku: "ops.claver_superadmin",
  },
  {
    id: "health_entornos",
    nombre: "Healthcheck entornos",
    descripcion: "Dispara job healthcheck en dev, val y prd del tenant.",
    categoria: "ops",
    riesgo: "bajo",
    duracionEstimada: "1–2 min",
    servicioSku: "ops.claver_superadmin",
  },
  {
    id: "snapshot_val",
    nombre: "Capturar snapshot VAL",
    descripcion: "Guarda configSnapshot del entorno VAL antes de parametrizar.",
    categoria: "implementacion",
    riesgo: "medio",
    duracionEstimada: "10–30 s",
    servicioSku: "ops.claver_superadmin",
  },
  {
    id: "sync_scrum",
    nombre: "Sincronizar backlog Scrum",
    descripcion: "Importa hitos CCA, tareas marketplace y tickets al tablero.",
    categoria: "implementacion",
    riesgo: "bajo",
    duracionEstimada: "< 10 s",
    servicioSku: "ops.claver_superadmin",
  },
  {
    id: "pack_almacen_barrio",
    nombre: "Activar pack almacén barrio",
    descripcion: "Provisiona fiado + cobranzas WA + WhatsApp (pool-almacen-barrio).",
    categoria: "activacion",
    riesgo: "medio",
    duracionEstimada: "1–3 min",
    servicioSku: "ops.claver_superadmin",
  },
  {
    id: "enganche_fiado",
    nombre: "Enganche Libreta Fiado",
    descripcion: "Provisiona pos.fiado_barrio para trial o demo comercial.",
    categoria: "activacion",
    riesgo: "bajo",
    duracionEstimada: "< 1 min",
    servicioSku: "ops.claver_superadmin",
  },
  {
    id: "backup_migrate_smoke",
    nombre: "Backup + migrate + smoke",
    descripcion: "Secuencia ops: backup_db, migrate_db y test_suite.",
    categoria: "ops",
    riesgo: "alto",
    duracionEstimada: "5–15 min",
    servicioSku: "ops.claver_superadmin",
  },
]

export function getPlaybookById(id: string): AnalystPlaybook | undefined {
  return ANALYST_PLAYBOOKS.find((p) => p.id === id)
}