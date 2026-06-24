import { prisma } from "@/lib/prisma"
import type { CatalogField, CatalogSource } from "@/lib/reporting/semantic/types"

export const CLAVERP_SOURCES: CatalogSource[] = [
  { id: "ventas", etiqueta: "Ventas (facturas)", descripcion: "Facturas emitidas y pendientes", connectorId: "claverp" },
  { id: "clientes", etiqueta: "Clientes", descripcion: "Maestro de clientes", connectorId: "claverp" },
  { id: "productos", etiqueta: "Productos", descripcion: "Catálogo de productos y stock", connectorId: "claverp" },
  { id: "compras", etiqueta: "Compras", descripcion: "Facturas de compra a proveedores", connectorId: "claverp" },
  { id: "stock_movimientos", etiqueta: "Movimientos de stock", descripcion: "Entradas, salidas y ajustes", connectorId: "claverp" },
]

export const CLAVERP_CATALOG_SEED: Omit<CatalogField, "connectorId">[] = [
  // ventas
  { fuente: "ventas", campo: "fecha", etiqueta: "Fecha", tipo: "fecha" },
  { fuente: "ventas", campo: "desde", etiqueta: "Desde", tipo: "fecha" },
  { fuente: "ventas", campo: "hasta", etiqueta: "Hasta", tipo: "fecha" },
  { fuente: "ventas", campo: "mes", etiqueta: "Mes", tipo: "dimension" },
  { fuente: "ventas", campo: "anio", etiqueta: "Año", tipo: "dimension" },
  { fuente: "ventas", campo: "cliente", etiqueta: "Cliente", tipo: "dimension" },
  { fuente: "ventas", campo: "estado", etiqueta: "Estado", tipo: "dimension" },
  { fuente: "ventas", campo: "tipo", etiqueta: "Tipo comprobante", tipo: "dimension" },
  { fuente: "ventas", campo: "numero", etiqueta: "Número", tipo: "dimension" },
  { fuente: "ventas", campo: "total", etiqueta: "Total", tipo: "medida", agregacion: "sum" },
  { fuente: "ventas", campo: "subtotal", etiqueta: "Subtotal", tipo: "medida", agregacion: "sum" },
  { fuente: "ventas", campo: "iva", etiqueta: "IVA", tipo: "medida", agregacion: "sum" },
  { fuente: "ventas", campo: "cantidad", etiqueta: "Cantidad facturas", tipo: "medida", agregacion: "count" },
  // clientes
  { fuente: "clientes", campo: "nombre", etiqueta: "Nombre", tipo: "dimension" },
  { fuente: "clientes", campo: "cuit", etiqueta: "CUIT", tipo: "dimension" },
  { fuente: "clientes", campo: "condicion_iva", etiqueta: "Condición IVA", tipo: "dimension" },
  { fuente: "clientes", campo: "cantidad", etiqueta: "Cantidad", tipo: "medida", agregacion: "count" },
  // productos
  { fuente: "productos", campo: "codigo", etiqueta: "Código", tipo: "dimension" },
  { fuente: "productos", campo: "nombre", etiqueta: "Nombre", tipo: "dimension" },
  { fuente: "productos", campo: "categoria", etiqueta: "Categoría", tipo: "dimension" },
  { fuente: "productos", campo: "precio", etiqueta: "Precio venta", tipo: "medida", agregacion: "avg" },
  { fuente: "productos", campo: "stock", etiqueta: "Stock", tipo: "medida", agregacion: "sum" },
  { fuente: "productos", campo: "cantidad", etiqueta: "Cantidad productos", tipo: "medida", agregacion: "count" },
  // compras
  { fuente: "compras", campo: "fecha", etiqueta: "Fecha", tipo: "fecha" },
  { fuente: "compras", campo: "mes", etiqueta: "Mes", tipo: "dimension" },
  { fuente: "compras", campo: "proveedor", etiqueta: "Proveedor", tipo: "dimension" },
  { fuente: "compras", campo: "total", etiqueta: "Total", tipo: "medida", agregacion: "sum" },
  { fuente: "compras", campo: "iva", etiqueta: "IVA", tipo: "medida", agregacion: "sum" },
  { fuente: "compras", campo: "cantidad", etiqueta: "Cantidad compras", tipo: "medida", agregacion: "count" },
  // stock
  { fuente: "stock_movimientos", campo: "fecha", etiqueta: "Fecha", tipo: "fecha" },
  { fuente: "stock_movimientos", campo: "producto", etiqueta: "Producto", tipo: "dimension" },
  { fuente: "stock_movimientos", campo: "tipo", etiqueta: "Tipo movimiento", tipo: "dimension" },
  { fuente: "stock_movimientos", campo: "cantidad", etiqueta: "Cantidad", tipo: "medida", agregacion: "sum" },
]

const STATIC_BY_SOURCE = new Map<string, CatalogField[]>()
for (const row of CLAVERP_CATALOG_SEED) {
  const key = `claverp:${row.fuente}`
  const list = STATIC_BY_SOURCE.get(key) ?? []
  list.push({ ...row, connectorId: "claverp" })
  STATIC_BY_SOURCE.set(key, list)
}

export async function seedReportCatalog() {
  const db = prisma as any
  for (let i = 0; i < CLAVERP_CATALOG_SEED.length; i++) {
    const row = CLAVERP_CATALOG_SEED[i]
    await db.reporteCatalogoCampo.upsert({
      where: {
        connectorId_fuente_campo: {
          connectorId: "claverp",
          fuente: row.fuente,
          campo: row.campo,
        },
      },
      create: {
        connectorId: "claverp",
        fuente: row.fuente,
        campo: row.campo,
        etiqueta: row.etiqueta,
        tipo: row.tipo,
        agregacion: row.agregacion ?? null,
        requiereRol: row.requiereRol ?? [],
        rubros: [],
        orden: i,
        activo: true,
      },
      update: {
        etiqueta: row.etiqueta,
        tipo: row.tipo,
        agregacion: row.agregacion ?? null,
        activo: true,
      },
    })
  }
}

export async function getCatalog(connectorId = "claverp", fuente?: string) {
  await seedReportCatalog()
  const db = prisma as any
  const where: Record<string, unknown> = { connectorId, activo: true }
  if (fuente) where.fuente = fuente

  const rows = await db.reporteCatalogoCampo.findMany({
    where,
    orderBy: [{ fuente: "asc" }, { orden: "asc" }],
  })

  return {
    sources: CLAVERP_SOURCES.filter((s) => s.connectorId === connectorId),
    campos: rows as CatalogField[],
  }
}

export function getCatalogField(
  connectorId: string,
  fuente: string,
  campo: string,
): CatalogField | undefined {
  return STATIC_BY_SOURCE.get(`${connectorId}:${fuente}`)?.find((c) => c.campo === campo)
}

export function listCatalogFields(connectorId: string, fuente: string): CatalogField[] {
  return STATIC_BY_SOURCE.get(`${connectorId}:${fuente}`) ?? []
}

export function assertFieldAllowed(
  connectorId: string,
  fuente: string,
  campo: string,
  rol: string,
): CatalogField {
  const field = getCatalogField(connectorId, fuente, campo)
  if (!field) throw new Error(`Campo no permitido: ${campo}`)
  if (field.requiereRol?.length && !field.requiereRol.includes(rol)) {
    throw new Error(`Sin permiso para el campo: ${field.etiqueta}`)
  }
  return field
}