export type EntornoCodigo = "dev" | "val" | "prd"
export type EntornoEstado = "activo" | "mantenimiento" | "detenido" | "error" | "desplegando"
export type OpsJobTipo = "backup_db" | "migrate_db" | "restart_app" | "deploy" | "healthcheck" | "test_suite"
export type OpsJobEstado = "pendiente" | "en_progreso" | "completado" | "error" | "cancelado"
export type PipelineEstado = "borrador" | "en_curso" | "aprobado" | "rechazado" | "completado"

export interface PipelinePaso {
  orden: number
  codigo: string
  nombre: string
  estado: "pendiente" | "en_curso" | "ok" | "error" | "omitido"
  detalle?: string
  ejecutadoAt?: string
}

export const PIPELINE_VAL_PRD_PASOS: Omit<PipelinePaso, "estado" | "ejecutadoAt">[] = [
  { orden: 1, codigo: "tests_auto", nombre: "Tests automáticos (smoke + unit)" },
  { orden: 2, codigo: "revision_analista", nombre: "Revisión funcional del analista" },
  { orden: 3, codigo: "backup_pre", nombre: "Backup pre-deploy de base" },
  { orden: 4, codigo: "migrate_db", nombre: "Migración de esquema (prisma migrate)" },
  { orden: 5, codigo: "deploy_app", nombre: "Deploy de aplicación" },
  { orden: 6, codigo: "smoke_post", nombre: "Smoke test post-deploy" },
  { orden: 7, codigo: "cierre", nombre: "Cierre y habilitación producción" },
]

export const OPS_JOB_LABELS: Record<OpsJobTipo, string> = {
  backup_db: "Backup de base",
  migrate_db: "Migración de base",
  restart_app: "Reinicio de aplicación",
  deploy: "Deploy",
  healthcheck: "Healthcheck",
  test_suite: "Suite de tests",
}