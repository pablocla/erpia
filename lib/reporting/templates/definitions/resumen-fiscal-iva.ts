import type { SheetTemplate } from "@/lib/reporting/templates/types"
import { filtrosAnioActual } from "@/lib/reporting/templates/types"

export const resumenFiscalIvaTemplate: SheetTemplate = {
  id: "resumen-fiscal-iva",
  nombre: "Resumen Fiscal / IVA",
  descripcion:
    "Evolución mensual de ventas, subtotal e IVA facturado. Base para conciliación con libro IVA y proyección impositiva.",
  categoria: "fiscal",
  vista: "grafico",
  fuente: "ventas",
  nombreSugerido: "Resumen fiscal IVA",
  tags: ["fiscal", "IVA", "AFIP", "gráfico"],
  icono: "Receipt",
  color: "text-red-600",
  tierMin: "lite",
  destacado: true,
  definicion: {
    connectorId: "claverp",
    fuente: "ventas",
    vista: "grafico",
    dimensiones: [{ campo: "mes" }],
    medidas: [
      { campo: "total", fn: "sum", etiqueta: "sum_total" },
      { campo: "iva", fn: "sum", etiqueta: "sum_iva" },
      { campo: "subtotal", fn: "sum", etiqueta: "sum_subtotal" },
    ],
    filtros: filtrosAnioActual(),
    chart: {
      tipo: "area",
      ejeX: "mes",
      series: ["sum_total", "sum_iva", "sum_subtotal"],
    },
    limit: 5000,
  },
}