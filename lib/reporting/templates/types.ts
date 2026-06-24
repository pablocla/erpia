import { z } from "zod"
import { reportDefinitionSchema, VISTA_TIPOS } from "@/lib/reporting/semantic/types"

export const TEMPLATE_CATEGORIAS = [
  "ventas",
  "clientes",
  "stock",
  "compras",
  "fiscal",
] as const

export const sheetTemplateSchema = z.object({
  id: z.string().min(2),
  nombre: z.string().min(2),
  descripcion: z.string().min(10),
  categoria: z.enum(TEMPLATE_CATEGORIAS),
  vista: z.enum(VISTA_TIPOS),
  fuente: z.string().min(1),
  nombreSugerido: z.string().min(2),
  tags: z.array(z.string()).default([]),
  icono: z.string().default("FileSpreadsheet"),
  color: z.string().default("text-primary"),
  tierMin: z.enum(["lite", "pro"]).default("lite"),
  destacado: z.boolean().default(false),
  definicion: reportDefinitionSchema,
})

export type SheetTemplate = z.infer<typeof sheetTemplateSchema>

export type SheetTemplateSummary = Pick<
  SheetTemplate,
  | "id"
  | "nombre"
  | "descripcion"
  | "categoria"
  | "vista"
  | "fuente"
  | "nombreSugerido"
  | "tags"
  | "icono"
  | "color"
  | "tierMin"
  | "destacado"
>

export function filtrosAnioActual() {
  const y = new Date().getFullYear()
  const hoy = new Date().toISOString().split("T")[0]
  return [
    { campo: "desde", op: "gte" as const, valor: `${y}-01-01` },
    { campo: "hasta", op: "lte" as const, valor: hoy },
  ]
}

export function filtrosUltimosMeses(meses: number) {
  const hasta = new Date()
  const desde = new Date()
  desde.setMonth(desde.getMonth() - meses)
  return [
    { campo: "desde", op: "gte" as const, valor: desde.toISOString().split("T")[0] },
    { campo: "hasta", op: "lte" as const, valor: hasta.toISOString().split("T")[0] },
  ]
}