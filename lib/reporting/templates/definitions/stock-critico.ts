import type { SheetTemplate } from "@/lib/reporting/templates/types"

export const stockCriticoTemplate: SheetTemplate = {
  id: "stock-critico",
  nombre: "Stock Crítico",
  descripcion:
    "Listado plano de productos con código, categoría y stock actual. Ordená por stock en el explorador para detectar quiebres.",
  categoria: "stock",
  vista: "plano",
  fuente: "productos",
  nombreSugerido: "Stock crítico",
  tags: ["plano", "inventario", "reposición"],
  icono: "Package",
  color: "text-orange-600",
  tierMin: "lite",
  destacado: false,
  definicion: {
    connectorId: "claverp",
    fuente: "productos",
    vista: "plano",
    dimensiones: [],
    medidas: [],
    filtros: [],
    camposPlano: ["codigo", "nombre", "categoria", "stock", "precio"],
    limit: 5000,
  },
}