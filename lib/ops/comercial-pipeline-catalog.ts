export const PIPELINE_ETAPAS = [
  "prospecto",
  "visita",
  "trial",
  "cerrado",
  "provisionado",
  "descartado",
] as const

export type PipelineEtapa = (typeof PIPELINE_ETAPAS)[number]

export const PIPELINE_ETAPA_LABELS: Record<PipelineEtapa, string> = {
  prospecto: "Prospecto",
  visita: "Visita",
  trial: "Prueba / demo",
  cerrado: "Cerrado",
  provisionado: "Provisionado",
  descartado: "Descartado",
}