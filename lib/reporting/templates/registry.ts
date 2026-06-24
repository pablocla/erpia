import { comprasProveedorTemplate } from "@/lib/reporting/templates/definitions/compras-proveedor"
import { resumenFiscalIvaTemplate } from "@/lib/reporting/templates/definitions/resumen-fiscal-iva"
import { stockCriticoTemplate } from "@/lib/reporting/templates/definitions/stock-critico"
import { topClientesTemplate } from "@/lib/reporting/templates/definitions/top-clientes"
import { ventasMesRubroTemplate } from "@/lib/reporting/templates/definitions/ventas-mes-rubro"
import {
  filtrosAnioActual,
  filtrosUltimosMeses,
  sheetTemplateSchema,
  type SheetTemplate,
  type SheetTemplateSummary,
} from "@/lib/reporting/templates/types"

const RAW_TEMPLATES: SheetTemplate[] = [
  ventasMesRubroTemplate,
  topClientesTemplate,
  stockCriticoTemplate,
  comprasProveedorTemplate,
  resumenFiscalIvaTemplate,
]

/** Plantillas validadas al boot — falla rápido si el JSON es inválido. */
export const SHEET_TEMPLATES: SheetTemplate[] = RAW_TEMPLATES.map((t) =>
  sheetTemplateSchema.parse(t),
)

const BY_ID = new Map(SHEET_TEMPLATES.map((t) => [t.id, t]))

export function listSheetTemplates(): SheetTemplateSummary[] {
  return SHEET_TEMPLATES.map((t) => ({
    id: t.id,
    nombre: t.nombre,
    descripcion: t.descripcion,
    categoria: t.categoria,
    vista: t.vista,
    fuente: t.fuente,
    nombreSugerido: t.nombreSugerido,
    tags: t.tags,
    icono: t.icono,
    color: t.color,
    tierMin: t.tierMin,
    destacado: t.destacado,
  }))
}

export function getSheetTemplate(id: string): SheetTemplate | undefined {
  return BY_ID.get(id)
}

export function getSheetTemplateOrThrow(id: string): SheetTemplate {
  const t = getSheetTemplate(id)
  if (!t) throw new Error(`Plantilla no encontrada: ${id}`)
  return t
}

/** Refresca filtros de fecha relativos al momento de uso. */
export function resolveTemplateDefinition(template: SheetTemplate): SheetTemplate {
  const fresh = sheetTemplateSchema.parse({
    ...template,
    definicion: {
      ...template.definicion,
      filtros: template.definicion.filtros.map((f) => ({ ...f })),
    },
  })

  if (fresh.id === "compras-proveedor") {
    fresh.definicion.filtros = filtrosUltimosMeses(6)
  } else if (
    fresh.id === "ventas-mes-rubro" ||
    fresh.id === "top-clientes" ||
    fresh.id === "resumen-fiscal-iva"
  ) {
    fresh.definicion.filtros = filtrosAnioActual()
  }

  return fresh
}