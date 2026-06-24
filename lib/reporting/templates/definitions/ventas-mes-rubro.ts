import type { SheetTemplate } from "@/lib/reporting/templates/types"
import { filtrosAnioActual } from "@/lib/reporting/templates/types"

/** Rubro operativo = tipo de comprobante hasta tener rubro de línea en catálogo. */
export const ventasMesRubroTemplate: SheetTemplate = {
  id: "ventas-mes-rubro",
  nombre: "Ventas por Mes y Rubro",
  descripcion:
    "Tabla pivot con ventas totales por mes y tipo de comprobante (Factura A/B/C, etc.). Ideal para ver estacionalidad y mix fiscal.",
  categoria: "ventas",
  vista: "pivot",
  fuente: "ventas",
  nombreSugerido: "Ventas por mes y tipo",
  tags: ["pivot", "ventas", "fiscal", "mensual"],
  icono: "BarChart3",
  color: "text-green-600",
  tierMin: "lite",
  destacado: true,
  definicion: {
    connectorId: "claverp",
    fuente: "ventas",
    vista: "pivot",
    dimensiones: [{ campo: "mes" }, { campo: "tipo" }],
    medidas: [{ campo: "total", fn: "sum", etiqueta: "sum_total" }],
    filtros: filtrosAnioActual(),
    pivot: {
      filas: ["mes"],
      columnas: ["tipo"],
      medida: "sum_total",
      fn: "sum",
    },
    limit: 5000,
  },
}