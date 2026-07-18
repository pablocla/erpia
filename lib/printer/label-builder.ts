/**
 * Etiquetas de góndola / precio — ESC/POS (Hasar / Epson térmicas).
 * Formato simple 40–50 mm de ancho.
 */

export interface EtiquetaProductoData {
  empresaNombre?: string
  nombre: string
  codigo?: string
  codigoBarras?: string
  precio: number
  unidad?: string
  /** Texto extra (ej. "OFERTA", "kg") */
  leyenda?: string
}

function fmtMoney(n: number): string {
  return `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Genera buffer ESC/POS de etiqueta de precio.
 * Compatible con impresoras térmicas 40/50/80 mm en modo etiqueta o ticket.
 */
export function buildEscPosEtiqueta(
  data: EtiquetaProductoData,
  opts: { anchoMm?: number } = {},
): Buffer {
  const chunks: Buffer[] = []
  const push = (t: string) => chunks.push(Buffer.from(t, "utf8"))
  const ancho = opts.anchoMm === 40 ? 40 : 50

  push("\x1b\x40") // init
  push("\x1b\x61\x01") // center

  if (data.empresaNombre) {
    push("\x1b\x21\x00")
    push(`${data.empresaNombre.slice(0, 28)}\n`)
  }

  push("\x1b\x21\x08") // emphasis
  const nombre = data.nombre.slice(0, ancho === 40 ? 24 : 32)
  push(`${nombre}\n`)
  push("\x1b\x21\x00")

  if (data.codigo || data.codigoBarras) {
    push(`${(data.codigoBarras || data.codigo || "").slice(0, 28)}\n`)
  }

  if (data.leyenda) {
    push(`${data.leyenda.slice(0, 20)}\n`)
  }

  push("\x1b\x21\x30") // double height/width
  push(`${fmtMoney(data.precio)}\n`)
  push("\x1b\x21\x00")

  if (data.unidad && data.unidad !== "unidad") {
    push(`por ${data.unidad}\n`)
  }

  // Código de barras CODE128 si hay código de barras
  const bc = (data.codigoBarras || data.codigo || "").replace(/\s/g, "")
  if (bc.length >= 4 && bc.length <= 48) {
    push("\n")
    // GS k m n d1...dn — CODE128 (m=73)
    const content = Buffer.from(bc, "ascii")
    chunks.push(Buffer.from([0x1d, 0x68, 0x50])) // height
    chunks.push(Buffer.from([0x1d, 0x77, 0x02])) // width
    chunks.push(Buffer.from([0x1d, 0x48, 0x02])) // HRI below
    chunks.push(Buffer.from([0x1d, 0x6b, 0x49, content.length]))
    chunks.push(content)
    push("\n")
  }

  push("\n\n")
  // partial cut
  chunks.push(Buffer.from([0x1d, 0x56, 0x41, 0x00]))

  return Buffer.concat(chunks)
}
