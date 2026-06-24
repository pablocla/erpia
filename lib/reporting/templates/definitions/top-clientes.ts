import type { SheetTemplate } from "@/lib/reporting/templates/types"
import { filtrosAnioActual } from "@/lib/reporting/templates/types"

export const topClientesTemplate: SheetTemplate = {
  id: "top-clientes",
  nombre: "Top 20 Clientes",
  descripcion:
    "Ranking de clientes por facturación del período. Gráfico de barras para identificar concentración de ingresos.",
  categoria: "clientes",
  vista: "grafico",
  fuente: "ventas",
  nombreSugerido: "Top clientes por ventas",
  tags: ["ranking", "clientes", "gráfico"],
  icono: "Users",
  color: "text-blue-600",
  tierMin: "lite",
  destacado: true,
  definicion: {
    connectorId: "claverp",
    fuente: "ventas",
    vista: "grafico",
    dimensiones: [{ campo: "cliente" }],
    medidas: [{ campo: "total", fn: "sum", etiqueta: "sum_total" }],
    filtros: filtrosAnioActual(),
    chart: {
      tipo: "bar",
      ejeX: "cliente",
      series: ["sum_total"],
    },
    limit: 5000,
  },
}