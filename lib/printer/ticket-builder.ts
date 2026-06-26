/**
 * Generador unificado de cuerpo de ticket fiscal ESC/POS.
 */

import type { TicketLegalData } from "@/lib/fiscal/ticket-legal"
import { escposQrCommands } from "@/lib/printer/qr-escpos"

function fmtCuit(cuit: string): string {
  const d = cuit.replace(/\D/g, "")
  if (d.length !== 11) return cuit
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`
}

function fmtFecha(fecha: Date): string {
  const dia = fecha.getDate().toString().padStart(2, "0")
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0")
  const anio = fecha.getFullYear()
  return `${dia}/${mes}/${anio}`
}

function fmtMoney(n: number): string {
  return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function line(ch = "-", width = 42): string {
  return ch.repeat(width) + "\n"
}

export function buildEscPosTicketBody(
  data: TicketLegalData,
  opts: { incluirQr?: boolean } = {},
): Buffer[] {
  const chunks: Buffer[] = []
  const push = (text: string) => chunks.push(Buffer.from(text, "utf8"))

  push("\x1b\x40") // init
  push("\x1b\x61\x01") // center
  push("\x1b\x21\x30")
  push(`${data.empresa.nombre}\n`)
  push("\x1b\x21\x00")
  push(`${data.empresa.razonSocial}\n`)
  push(`CUIT: ${fmtCuit(data.empresa.cuit)}\n`)
  if (data.empresa.iibb) push(`IIBB: ${data.empresa.iibb}\n`)
  push(`Cond. IVA: ${data.empresa.condicionIva} (${data.empresa.condicionIvaCodigo})\n`)
  push(`${data.empresa.direccion}\n`)
  push(`P.Vta: ${String(data.empresa.puntoVenta).padStart(5, "0")}\n`)

  push("\x1b\x61\x00")
  push(line())

  push("\x1b\x21\x08")
  push(`${data.factura.nombreComprobante}\n`)
  push("\x1b\x21\x00")
  push(`Cod. ${String(data.factura.tipoCbte).padStart(2, "0")} · ${data.factura.numeroCompleto}\n`)
  push(`Fecha: ${fmtFecha(data.factura.fecha)}\n`)
  if (data.factura.moneda !== "PES") {
    push(`Moneda: ${data.factura.moneda} TC ${data.factura.tipoCambio.toFixed(4)}\n`)
  }

  push(line())
  push(`Cliente: ${data.cliente.nombre}\n`)
  if (data.cliente.cuit) push(`CUIT: ${fmtCuit(data.cliente.cuit)}\n`)
  else if (data.cliente.dni) push(`DNI: ${data.cliente.dni}\n`)
  push(`Cond. IVA: ${data.cliente.condicionIva} (${data.cliente.condicionIvaCodigo})\n`)
  if (data.cliente.direccion) push(`${data.cliente.direccion}\n`)

  push(line())
  push("Cant  Descripcion           Importe\n")
  push(line())

  for (const item of data.items) {
    const cant = item.cantidad.toString().padEnd(5)
    const desc = item.descripcion.slice(0, 20).padEnd(20)
    push(`${cant} ${desc} ${fmtMoney(item.total).padStart(9)}\n`)
    if (item.iva > 0) push(`      IVA ${item.iva}%\n`)
  }

  push(line())
  for (const row of data.ivaDesglose) {
    push(`Neto ${row.alicuota}%: ${fmtMoney(row.neto).padStart(22)}\n`)
    push(`IVA ${row.alicuota}%:  ${fmtMoney(row.iva).padStart(22)}\n`)
  }
  push(`Subtotal: ${fmtMoney(data.totales.subtotal).padStart(26)}\n`)
  push(`IVA:      ${fmtMoney(data.totales.iva).padStart(26)}\n`)
  if (data.totales.percepciones > 0) {
    push(`Perc.:   ${fmtMoney(data.totales.percepciones).padStart(26)}\n`)
  }
  push("\x1b\x21\x30")
  push(`TOTAL:    ${fmtMoney(data.totales.total).padStart(26)}\n`)
  push("\x1b\x21\x00")

  if (!data.factura.esTicket && data.factura.cae) {
    push(line())
    push("\x1b\x61\x01")
    const authLabel = data.factura.modalidadAuth === "CAEA" ? "CAEA" : "CAE"
    push(`COMPROBANTE AUTORIZADO (${authLabel})\n`)
    push(`${authLabel}: ${data.factura.cae}\n`)
    push(`Vto: ${fmtFecha(data.factura.vencimientoCAE)}\n`)

    if (opts.incluirQr !== false && data.qrUrl) {
      push("\nVerifique en AFIP:\n")
      chunks.push(escposQrCommands(data.qrUrl))
    }
  } else if (data.factura.esTicket) {
    push(line())
    push("\x1b\x61\x01")
    push("*** TICKET SIN CAE ***\n")
    push("No valido como comprobante fiscal\n")
  }

  push("\n")
  for (const ley of data.leyendas.slice(0, 4)) {
    push(`${ley}\n`)
  }

  push("\n\n\n")
  chunks.push(Buffer.from([0x1d, 0x56, 0x41, 0x00])) // cut

  return chunks
}