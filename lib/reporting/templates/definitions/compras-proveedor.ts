import type { SheetTemplate } from "@/lib/reporting/templates/types"
import { filtrosUltimosMeses } from "@/lib/reporting/templates/types"

export const comprasProveedorTemplate: SheetTemplate = {
  id: "compras-proveedor",
  nombre: "Compras por Proveedor",
  descripcion:
    "Pivot de compras por proveedor y mes. Controlá gastos y negociá con los principales proveedores.",
  categoria: "compras",
  vista: "pivot",
  fuente: "compras",
  nombreSugerido: "Compras por proveedor",
  tags: ["pivot", "compras", "proveedores"],
  icono: "ShoppingCart",
  color: "text-violet-600",
  tierMin: "lite",
  destacado: false,
  definicion: {
    connectorId: "claverp",
    fuente: "compras",
    vista: "pivot",
    dimensiones: [{ campo: "proveedor" }, { campo: "mes" }],
    medidas: [{ campo: "total", fn: "sum", etiqueta: "sum_total" }],
    filtros: filtrosUltimosMeses(6),
    pivot: {
      filas: ["proveedor"],
      columnas: ["mes"],
      medida: "sum_total",
      fn: "sum",
    },
    limit: 5000,
  },
}