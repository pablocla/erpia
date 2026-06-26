/**
 * #1 Importador listas distribuidoras Rosario (CSV/TSV).
 */
import { prisma } from "@/lib/prisma"
import { getAlmacenRosarioConfig } from "./config"

export interface FilaListaDistribuidora {
  codigo?: string
  codigoBarras?: string
  nombre?: string
  precioCosto: number
}

export interface PropuestaActualizacion {
  productoId: number
  codigo: string
  nombre: string
  precioCompraAnterior: number
  precioCompraNuevo: number
  precioVentaAnterior: number
  precioVentaSugerido: number
  margenPct: number
}

export interface ResultadoImportacionLista {
  filasLeidas: number
  coincidencias: number
  sinMatch: number
  propuestas: PropuestaActualizacion[]
  errores: string[]
}

function normalizarHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, "_")
}

function parseNumero(raw: string): number | null {
  const limpio = raw.replace(/\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  const n = parseFloat(limpio)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Parsea CSV/TSV con detección de separador */
export function parsearListaDistribuidora(contenido: string): FilaListaDistribuidora[] {
  const lineas = contenido
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lineas.length < 2) return []

  const sep = lineas[0].includes("\t") ? "\t" : lineas[0].includes(";") ? ";" : ","
  const headers = lineas[0].split(sep).map(normalizarHeader)

  const idxCodigo = headers.findIndex((h) => /codigo|sku|plu|articulo/.test(h) && !/barra|ean/.test(h))
  const idxBarras = headers.findIndex((h) => /barra|ean|gtin/.test(h))
  const idxNombre = headers.findIndex((h) => /nombre|descripcion|producto/.test(h))
  const idxCosto = headers.findIndex((h) => /costo|precio_compra|precio_costo|lista|pvp_proveedor/.test(h))

  const filas: FilaListaDistribuidora[] = []
  for (let i = 1; i < lineas.length; i++) {
    const cols = lineas[i].split(sep)
    const costoRaw = idxCosto >= 0 ? cols[idxCosto] : cols[cols.length - 1]
    const precioCosto = parseNumero(costoRaw ?? "")
    if (precioCosto == null) continue

    filas.push({
      codigo: idxCodigo >= 0 ? cols[idxCodigo]?.trim() : undefined,
      codigoBarras: idxBarras >= 0 ? cols[idxBarras]?.trim() : undefined,
      nombre: idxNombre >= 0 ? cols[idxNombre]?.trim() : undefined,
      precioCosto,
    })
  }
  return filas
}

export async function generarPropuestasLista(
  empresaId: number,
  filas: FilaListaDistribuidora[],
): Promise<ResultadoImportacionLista> {
  const config = await getAlmacenRosarioConfig(empresaId)
  const margenDefault = config.margen.margenDefaultPct
  const propuestas: PropuestaActualizacion[] = []
  const errores: string[] = []
  let sinMatch = 0

  const productos = await prisma.producto.findMany({
    where: { empresaId, activo: true, deletedAt: null },
    select: {
      id: true,
      codigo: true,
      codigoBarras: true,
      nombre: true,
      precioCompra: true,
      precioVenta: true,
      margenGanancia: true,
    },
  })

  const byCodigo = new Map(productos.map((p) => [p.codigo.toLowerCase(), p]))
  const byBarras = new Map(
    productos.filter((p) => p.codigoBarras).map((p) => [p.codigoBarras!.toLowerCase(), p]),
  )

  for (const fila of filas) {
    let p =
      (fila.codigo && byCodigo.get(fila.codigo.toLowerCase())) ||
      (fila.codigoBarras && byBarras.get(fila.codigoBarras.toLowerCase()))

    if (!p && fila.nombre) {
      const nombreLower = fila.nombre.toLowerCase()
      p = productos.find((x) => x.nombre.toLowerCase().includes(nombreLower.slice(0, 12)))
    }

    if (!p) {
      sinMatch++
      continue
    }

    const margen = p.margenGanancia > 0 ? p.margenGanancia : margenDefault
    const precioVentaSugerido = Math.round(fila.precioCosto * (1 + margen / 100) * 100) / 100

    propuestas.push({
      productoId: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      precioCompraAnterior: Number(p.precioCompra),
      precioCompraNuevo: fila.precioCosto,
      precioVentaAnterior: Number(p.precioVenta),
      precioVentaSugerido,
      margenPct: margen,
    })
  }

  return {
    filasLeidas: filas.length,
    coincidencias: propuestas.length,
    sinMatch,
    propuestas: propuestas.sort((a, b) => b.precioCompraNuevo - a.precioCompraAnterior).slice(0, 200),
    errores,
  }
}

export async function aplicarPropuestasLista(
  empresaId: number,
  propuestas: Array<{ productoId: number; precioCompraNuevo: number; precioVentaSugerido: number }>,
) {
  let aplicados = 0
  for (const prop of propuestas) {
    const updated = await prisma.producto.updateMany({
      where: { id: prop.productoId, empresaId },
      data: {
        precioCompra: prop.precioCompraNuevo,
        precioVenta: prop.precioVentaSugerido,
      },
    })
    if (updated.count > 0) aplicados++
  }
  return { aplicados }
}