/**
 * Auto-mapeo heurístico de columnas Excel/CSV → campos de dominio ERP.
 * Usado por importadores de productos y el componente CSVImport.
 */

export type ProductImportField =
  | "codigo"
  | "nombre"
  | "precioVenta"
  | "precioCosto"
  | "stockInicial"
  | "alicuotaIva"
  | "categoria"
  | "codigoBarras"
  | "unidad"

export interface ColumnMatchTarget {
  key: string
  label: string
  aliases?: string[]
}

/** Alias frecuentes en exports de Tango, Softland, Excel de almacenes, etc. */
export const PRODUCT_IMPORT_TARGETS: ColumnMatchTarget[] = [
  {
    key: "codigo",
    label: "Código",
    aliases: ["codigo", "cod", "sku", "código", "cod_art", "articulo_cod", "id", "item"],
  },
  {
    key: "nombre",
    label: "Nombre",
    aliases: [
      "nombre",
      "producto",
      "descripcion",
      "descripción",
      "articulo",
      "artículo",
      "detalle",
      "title",
    ],
  },
  {
    key: "precioVenta",
    label: "Precio venta",
    aliases: [
      "precioventa",
      "precio",
      "p. venta",
      "pventa",
      "pvp",
      "precio_venta",
      "lista",
      "importe",
    ],
  },
  {
    key: "precioCosto",
    label: "Costo",
    aliases: [
      "preciocosto",
      "costo",
      "p. costo",
      "pcosto",
      "precio_costo",
      "preciocompra",
      "precio_compra",
      "costo_unitario",
    ],
  },
  {
    key: "stockInicial",
    label: "Stock",
    aliases: ["stock", "cant", "cantidad", "stockinicial", "existencia", "qty", "saldo"],
  },
  {
    key: "alicuotaIva",
    label: "IVA %",
    aliases: ["iva", "alicuota", "alícuota", "porcentajeiva", "porcentaje_iva", "alic"],
  },
  {
    key: "categoria",
    label: "Categoría",
    aliases: ["categoria", "categoría", "rubro", "grupo", "familia", "seccion", "sección"],
  },
  {
    key: "codigoBarras",
    label: "Código de barras",
    aliases: ["codigobarras", "ean", "barcode", "barras", "gtin", "upc"],
  },
  {
    key: "unidad",
    label: "Unidad",
    aliases: ["unidad", "um", "uom", "medida"],
  },
]

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\-./]+/g, " ")
    .replace(/\s+/g, " ")
}

/**
 * Sugiere mapeo campo → header original del archivo.
 * Retorna solo coincidencias con score razonable.
 */
export function matchColumns(
  headers: string[],
  targets: ColumnMatchTarget[] = PRODUCT_IMPORT_TARGETS,
): Record<string, string> {
  const mapping: Record<string, string> = {}
  const usedHeaders = new Set<string>()

  for (const target of targets) {
    let best: { header: string; score: number } | null = null

    for (const header of headers) {
      if (usedHeaders.has(header)) continue
      const score = scoreHeaderAgainstTarget(header, target)
      if (score <= 0) continue
      if (!best || score > best.score) {
        best = { header, score }
      }
    }

    if (best && best.score >= 0.6) {
      mapping[target.key] = best.header
      usedHeaders.add(best.header)
    }
  }

  return mapping
}

function scoreHeaderAgainstTarget(header: string, target: ColumnMatchTarget): number {
  const n = normalizeHeader(header)
  const keyN = normalizeHeader(target.key)
  const labelN = normalizeHeader(target.label)
  const aliases = (target.aliases ?? []).map(normalizeHeader)

  if (n === keyN || n === labelN) return 1
  if (aliases.includes(n)) return 0.95
  if (n.replace(/\s/g, "") === keyN.replace(/\s/g, "")) return 0.9

  for (const a of aliases) {
    if (n.includes(a) || a.includes(n)) return 0.75
  }
  if (n.includes(keyN) || keyN.includes(n)) return 0.7
  if (n.includes(labelN) || labelN.includes(n)) return 0.65

  return 0
}

/**
 * Aplica mapeo a filas de valores indexadas por posición de header.
 */
export function applyColumnMapping(
  headers: string[],
  rows: string[][],
  mapping: Record<string, string>,
): Record<string, string>[] {
  return rows.map((row) => {
    const obj: Record<string, string> = {}
    for (const [field, header] of Object.entries(mapping)) {
      const idx = headers.indexOf(header)
      obj[field] = idx >= 0 ? (row[idx] ?? "").trim() : ""
    }
    return obj
  })
}
