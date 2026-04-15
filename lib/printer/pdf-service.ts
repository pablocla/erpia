/**
 * PDF Service — Generación de facturas y comprobantes en PDF
 *
 * Implementa un generador HTML→PDF que construye el comprobante con:
 *   - Datos del emisor (empresa, CUIT, IIBB, domicilio)
 *   - Datos del receptor (cliente, CUIT, condición IVA)
 *   - Detalle de ítems con IVA discriminado
 *   - QR fiscal AFIP (base64)
 *   - CAE y vencimiento
 *   - Leyendas regulatorias (RG-1415, RG-5616)
 *
 * La función principal genera HTML listo para enviar al navegador (print/save as PDF)
 * o para ser servido como endpoint descargable.
 */

import { prisma } from "@/lib/prisma"

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface PDFFacturaData {
  facturaId: number
  empresaId?: number
}

export interface PDFComprobante {
  html: string
  filename: string
  metadata: {
    tipo: string
    numero: string
    fecha: string
    total: number
    cae: string
  }
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export class PDFService {

  /**
   * Genera el HTML del comprobante listo para imprimir/PDF.
   */
  async generarFacturaPDF(data: PDFFacturaData): Promise<PDFComprobante> {
    const factura = await prisma.factura.findUnique({
      where: { id: data.facturaId },
      include: {
        lineas: true,
        cliente: true,
        empresa: true,
      },
    })

    if (!factura) throw new Error("Factura no encontrada")

    const empresa = factura.empresa
    const cliente = factura.cliente
    const tipo = factura.tipo ?? "B"
    const letra = tipo.charAt(0)
    const pvStr = String(factura.puntoVenta).padStart(5, "0")
    const numStr = String(factura.numero).padStart(8, "0")
    const numeroCompleto = `${pvStr}-${numStr}`

    const fecha = factura.createdAt
      ? new Date(factura.createdAt).toLocaleDateString("es-AR")
      : new Date().toLocaleDateString("es-AR")

    const vtoCAE = factura.vencimientoCAE
      ? new Date(factura.vencimientoCAE).toLocaleDateString("es-AR")
      : "—"

    // Build line items HTML
    const lineasHTML = (factura.lineas ?? []).map((l) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.productoId ?? ""}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.descripcion}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(l.cantidad).toFixed(2)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(l.precioUnitario).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: center;">${Number(l.porcentajeIva)}%</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(l.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("")

    const condIvaEmisor = empresa?.condicionIva ?? "Responsable Inscripto"
    const condIvaReceptor = cliente?.condicionIva ?? "Consumidor Final"
    const iibbEmisor = ""

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${tipo} ${numeroCompleto}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
    }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 12px; }
    .header { display: flex; justify-content: space-between; border: 2px solid #333; margin-bottom: 16px; }
    .header-left, .header-right { flex: 1; padding: 12px 16px; }
    .header-center { width: 80px; text-align: center; border-left: 2px solid #333; border-right: 2px solid #333; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .letra-tipo { font-size: 32px; font-weight: bold; }
    .letra-cod { font-size: 10px; color: #666; }
    .empresa-nombre { font-size: 18px; font-weight: bold; margin-bottom: 4px; }
    .numero-cbte { font-size: 14px; font-weight: bold; margin-bottom: 4px; }
    .dato { font-size: 11px; color: #555; line-height: 1.6; }
    .seccion { border: 1px solid #ccc; padding: 10px 14px; margin-bottom: 12px; border-radius: 2px; }
    .seccion-titulo { font-weight: bold; font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #555; border-bottom: 2px solid #ccc; }
    .totales { text-align: right; padding-top: 8px; }
    .totales-row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; font-size: 12px; }
    .totales-row.total { font-size: 16px; font-weight: bold; border-top: 2px solid #333; padding-top: 8px; margin-top: 4px; }
    .cae-section { border-top: 2px solid #333; margin-top: 16px; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-start; }
    .qr-box { width: 120px; height: 120px; }
    .qr-box img { width: 100%; height: 100%; }
    .cae-data { text-align: right; }
    .cae-numero { font-size: 14px; font-weight: bold; }
    .leyenda { font-size: 9px; color: #888; text-align: center; margin-top: 16px; border-top: 1px solid #eee; padding-top: 8px; }
    .btn-print { position: fixed; top: 10px; right: 10px; background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; z-index: 100; }
    .btn-print:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <div class="empresa-nombre">${empresa?.razonSocial ?? empresa?.nombre ?? "Empresa"}</div>
      <div class="dato">CUIT: ${empresa?.cuit ?? "—"}</div>
      <div class="dato">Cond. IVA: ${condIvaEmisor}</div>
      ${iibbEmisor ? `<div class="dato">IIBB: ${iibbEmisor}</div>` : ""}
      <div class="dato">${empresa?.direccion ?? ""}</div>
    </div>
    <div class="header-center">
      <div class="letra-tipo">${letra}</div>
      <div class="letra-cod">Cód. ${String(factura.tipoCbte ?? "").padStart(2, "0")}</div>
    </div>
    <div class="header-right" style="text-align: right;">
      <div class="numero-cbte">FACTURA</div>
      <div class="numero-cbte">Nº ${numeroCompleto}</div>
      <div class="dato">Fecha: ${fecha}</div>
      <div class="dato">Punto de Venta: ${pvStr}</div>
      ${factura.monedaOrigen && factura.monedaOrigen !== "PES" ? `<div class="dato">Moneda: ${factura.monedaOrigen} — TC: ${Number(factura.tipoCambio).toFixed(4)}</div>` : ""}
    </div>
  </div>

  <!-- DATOS RECEPTOR -->
  <div class="seccion">
    <div class="seccion-titulo">Datos del receptor</div>
    <div style="display: flex; justify-content: space-between;">
      <div>
        <div class="dato"><strong>${cliente?.nombre ?? "Consumidor Final"}</strong></div>
        <div class="dato">CUIT/DNI: ${cliente?.cuit ?? factura.cuitReceptor ?? "—"}</div>
      </div>
      <div style="text-align: right;">
        <div class="dato">Cond. IVA: ${condIvaReceptor}</div>
        <div class="dato">${cliente?.direccion ?? ""}</div>
      </div>
    </div>
  </div>

  <!-- DETALLE -->
  <table>
    <thead>
      <tr>
        <th style="width: 60px;">Cód.</th>
        <th>Descripción</th>
        <th style="text-align: right; width: 80px;">Cant.</th>
        <th style="text-align: right; width: 100px;">P. Unit.</th>
        <th style="text-align: center; width: 60px;">IVA</th>
        <th style="text-align: right; width: 110px;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${lineasHTML}
    </tbody>
  </table>

  <!-- TOTALES -->
  <div class="totales">
    <div class="totales-row"><span>Subtotal Neto:</span> <span>$${Number(factura.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
    <div class="totales-row"><span>IVA:</span> <span>$${Number(factura.iva).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
    ${Number(factura.totalPercepciones) > 0 ? `<div class="totales-row"><span>Percepciones:</span> <span>$${Number(factura.totalPercepciones).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>` : ""}
    ${Number(factura.totalRetenciones) > 0 ? `<div class="totales-row"><span>Retenciones:</span> <span>$${Number(factura.totalRetenciones).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>` : ""}
    <div class="totales-row total"><span>TOTAL:</span> <span>$${Number(factura.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
  </div>

  <!-- CAE + QR -->
  <div class="cae-section">
    <div class="qr-box">
      ${factura.qrBase64 ? `<img src="${factura.qrBase64}" alt="QR Fiscal" />` : '<div style="border: 1px dashed #ccc; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 10px;">QR no disponible</div>'}
    </div>
    <div class="cae-data">
      <div class="dato">CAE Nº:</div>
      <div class="cae-numero">${factura.cae ?? "—"}</div>
      <div class="dato" style="margin-top: 4px;">Vencimiento CAE: ${vtoCAE}</div>
    </div>
  </div>

  <!-- LEYENDA REGULATORIA -->
  <div class="leyenda">
    Esta factura electrónica fue autorizada por AFIP — Resolución General Nº 1415/2003 y modificatorias.
    ${factura.monedaOrigen && factura.monedaOrigen !== "PES" ? " | Operación en moneda extranjera — RG 5616/2024." : ""}
  </div>

  ${factura.observaciones ? `<div class="dato" style="margin-top: 8px; font-style: italic;">Observaciones: ${factura.observaciones}</div>` : ""}
</body>
</html>`

    return {
      html,
      filename: `factura_${tipo}_${numeroCompleto.replace("-", "_")}.html`,
      metadata: {
        tipo: `Factura ${tipo}`,
        numero: numeroCompleto,
        fecha,
        total: Number(factura.total),
        cae: factura.cae ?? "",
      },
    }
  }

  /**
   * Genera PDF para Nota de Crédito.
   */
  async generarNCPDF(ncId: number): Promise<PDFComprobante> {
    const nc = await prisma.notaCredito.findUnique({
      where: { id: ncId },
      include: {
        factura: { include: { empresa: true } },
        cliente: true,
      },
    })

    if (!nc) throw new Error("Nota de Crédito no encontrada")

    const empresa = nc.factura?.empresa
    const cliente = nc.cliente
    const tipo = nc.tipo ?? "NC B"
    const pvStr = String(nc.puntoVenta).padStart(5, "0")
    const numStr = String(nc.numero).padStart(8, "0")
    const numeroCompleto = `${pvStr}-${numStr}`
    const fecha = new Date(nc.createdAt).toLocaleDateString("es-AR")

    // NC doesn't have lineas relation — build from factura info
    const lineasHTML = `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${nc.motivo}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">1</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(nc.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(nc.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
      </tr>
    `

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Nota de Crédito ${tipo} ${numeroCompleto}</title>
  <style>
    @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 12px; }
    .header { display: flex; justify-content: space-between; border: 2px solid #c00; margin-bottom: 16px; }
    .header-left, .header-right { flex: 1; padding: 12px 16px; }
    .header-center { width: 80px; text-align: center; border-left: 2px solid #c00; border-right: 2px solid #c00; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fef2f2; }
    .letra-tipo { font-size: 32px; font-weight: bold; color: #c00; }
    .empresa-nombre { font-size: 18px; font-weight: bold; }
    .numero-cbte { font-size: 14px; font-weight: bold; color: #c00; }
    .dato { font-size: 11px; color: #555; line-height: 1.6; }
    .seccion { border: 1px solid #ccc; padding: 10px 14px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #fef2f2; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #c00; border-bottom: 2px solid #fca5a5; }
    .totales { text-align: right; padding-top: 8px; }
    .totales-row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; }
    .totales-row.total { font-size: 16px; font-weight: bold; border-top: 2px solid #c00; padding-top: 8px; color: #c00; }
    .leyenda { font-size: 9px; color: #888; text-align: center; margin-top: 16px; border-top: 1px solid #eee; padding-top: 8px; }
    .btn-print { position: fixed; top: 10px; right: 10px; background: #dc2626; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

  <div class="header">
    <div class="header-left">
      <div class="empresa-nombre">${empresa?.razonSocial ?? empresa?.nombre ?? "Empresa"}</div>
      <div class="dato">CUIT: ${empresa?.cuit ?? "—"}</div>
      <div class="dato">Cond. IVA: ${empresa?.condicionIva ?? "Responsable Inscripto"}</div>
    </div>
    <div class="header-center">
      <div class="letra-tipo">${tipo.includes("A") ? "A" : tipo.includes("C") ? "C" : "B"}</div>
      <div style="font-size: 10px; color: #c00;">NOTA DE CRÉDITO</div>
    </div>
    <div class="header-right" style="text-align: right;">
      <div class="numero-cbte">NOTA DE CRÉDITO</div>
      <div class="numero-cbte">Nº ${numeroCompleto}</div>
      <div class="dato">Fecha: ${fecha}</div>
      <div class="dato">Factura Orig.: ${nc.factura ? `${String(nc.factura.puntoVenta).padStart(5, "0")}-${String(nc.factura.numero).padStart(8, "0")}` : "—"}</div>
    </div>
  </div>

  <div class="seccion">
    <div style="font-size: 11px; font-weight: bold; color: #555; margin-bottom: 6px;">DATOS DEL RECEPTOR</div>
    <div class="dato"><strong>${cliente?.nombre ?? "—"}</strong> — CUIT: ${cliente?.cuit ?? "—"} — ${cliente?.condicionIva ?? "—"}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th style="text-align: right;">Cant.</th>
        <th style="text-align: right;">P. Unit.</th>
        <th style="text-align: right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${lineasHTML}</tbody>
  </table>

  <div class="totales">
    <div class="totales-row"><span>Subtotal:</span> <span>$${Number(nc.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
    <div class="totales-row"><span>IVA:</span> <span>$${Number(nc.iva).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
    <div class="totales-row total"><span>TOTAL NC:</span> <span>$${Number(nc.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
  </div>

  <div style="margin-top: 16px; text-align: right;">
    <div class="dato">CAE: <strong>${nc.cae ?? "—"}</strong></div>
    <div class="dato">Vto CAE: ${nc.vencimientoCAE ? new Date(nc.vencimientoCAE).toLocaleDateString("es-AR") : "—"}</div>
  </div>

  <div class="leyenda">Nota de Crédito electrónica autorizada por AFIP — RG Nº 1415/2003.</div>
  ${nc.motivo ? `<div class="dato" style="margin-top: 8px;">Motivo: ${nc.motivo}</div>` : ""}
</body>
</html>`

    return {
      html,
      filename: `nc_${tipo.replace(/\s/g, "_")}_${numeroCompleto.replace("-", "_")}.html`,
      metadata: {
        tipo,
        numero: numeroCompleto,
        fecha,
        total: Number(nc.total),
        cae: nc.cae ?? "",
      },
    }
  }

  /**
   * Genera PDF para Nota de Débito.
   */
  async generarNDPDF(ndId: number): Promise<PDFComprobante> {
    const nd = await prisma.notaDebito.findUnique({
      where: { id: ndId },
      include: {
        factura: { include: { empresa: true } },
        cliente: true,
        lineas: true,
      },
    })

    if (!nd) throw new Error("Nota de Débito no encontrada")

    const empresa = nd.factura?.empresa
    const cliente = nd.cliente
    const tipo = nd.tipo ?? "ND B"
    const pvStr = String(nd.puntoVenta).padStart(5, "0")
    const numStr = String(nd.numero).padStart(8, "0")
    const numeroCompleto = `${pvStr}-${numStr}`
    const fecha = new Date(nd.createdAt).toLocaleDateString("es-AR")

    const lineasHTML = (nd.lineas ?? []).map((l) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.descripcion}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(l.cantidad).toFixed(2)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(l.precioUnitario).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: center;">${Number(l.porcentajeIva)}%</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(l.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("")

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Nota de Débito ${tipo} ${numeroCompleto}</title>
  <style>
    @media print { body { margin: 0; padding: 0; } .no-print { display: none !important; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 12px; }
    .header { display: flex; justify-content: space-between; border: 2px solid #b45309; margin-bottom: 16px; }
    .header-left, .header-right { flex: 1; padding: 12px 16px; }
    .header-center { width: 80px; text-align: center; border-left: 2px solid #b45309; border-right: 2px solid #b45309; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fefce8; }
    .letra-tipo { font-size: 32px; font-weight: bold; color: #b45309; }
    .empresa-nombre { font-size: 18px; font-weight: bold; }
    .numero-cbte { font-size: 14px; font-weight: bold; color: #b45309; }
    .dato { font-size: 11px; color: #555; line-height: 1.6; }
    .seccion { border: 1px solid #ccc; padding: 10px 14px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #fefce8; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #b45309; border-bottom: 2px solid #fbbf24; }
    .totales { text-align: right; padding-top: 8px; }
    .totales-row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; }
    .totales-row.total { font-size: 16px; font-weight: bold; border-top: 2px solid #b45309; padding-top: 8px; color: #b45309; }
    .leyenda { font-size: 9px; color: #888; text-align: center; margin-top: 16px; border-top: 1px solid #eee; padding-top: 8px; }
    .btn-print { position: fixed; top: 10px; right: 10px; background: #b45309; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

  <div class="header">
    <div class="header-left">
      <div class="empresa-nombre">${empresa?.razonSocial ?? empresa?.nombre ?? "Empresa"}</div>
      <div class="dato">CUIT: ${empresa?.cuit ?? "—"}</div>
      <div class="dato">Cond. IVA: ${empresa?.condicionIva ?? "Responsable Inscripto"}</div>
    </div>
    <div class="header-center">
      <div class="letra-tipo">${tipo.includes("A") ? "A" : tipo.includes("C") ? "C" : "B"}</div>
      <div style="font-size: 10px; color: #b45309;">NOTA DE DÉBITO</div>
    </div>
    <div class="header-right" style="text-align: right;">
      <div class="numero-cbte">NOTA DE DÉBITO</div>
      <div class="numero-cbte">Nº ${numeroCompleto}</div>
      <div class="dato">Fecha: ${fecha}</div>
      <div class="dato">Factura Orig.: ${nd.factura ? `${String(nd.factura.puntoVenta).padStart(5, "0")}-${String(nd.factura.numero).padStart(8, "0")}` : "—"}</div>
    </div>
  </div>

  <div class="seccion">
    <div style="font-size: 11px; font-weight: bold; color: #555; margin-bottom: 6px;">DATOS DEL RECEPTOR</div>
    <div class="dato"><strong>${cliente?.nombre ?? "—"}</strong> — CUIT: ${cliente?.cuit ?? "—"} — ${cliente?.condicionIva ?? "—"}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th style="text-align: right;">Cant.</th>
        <th style="text-align: right;">P. Unit.</th>
        <th style="text-align: center;">IVA</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>${lineasHTML}</tbody>
  </table>

  <div class="totales">
    <div class="totales-row"><span>Subtotal:</span> <span>$${Number(nd.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
    <div class="totales-row"><span>IVA:</span> <span>$${Number(nd.iva).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
    ${Number(nd.totalPercepciones) > 0 ? `<div class="totales-row"><span>Percepciones:</span> <span>$${Number(nd.totalPercepciones).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>` : ""}
    <div class="totales-row total"><span>TOTAL ND:</span> <span>$${Number(nd.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
  </div>

  <div style="margin-top: 16px; text-align: right;">
    <div class="dato">CAE: <strong>${nd.cae ?? "—"}</strong></div>
    <div class="dato">Vto CAE: ${nd.vencimientoCAE ? new Date(nd.vencimientoCAE).toLocaleDateString("es-AR") : "—"}</div>
  </div>

  <div class="leyenda">Nota de Débito electrónica autorizada por AFIP — RG Nº 1415/2003. ${nd.motivo ? `Motivo: ${nd.motivo}` : ""}</div>
</body>
</html>`

    return {
      html,
      filename: `nd_${tipo.replace(/\s/g, "_")}_${numeroCompleto.replace("-", "_")}.html`,
      metadata: {
        tipo: `Nota de Débito ${tipo}`,
        numero: numeroCompleto,
        fecha,
        total: Number(nd.total),
        cae: nd.cae ?? "",
      },
    }
  }

  /**
   * Genera PDF para Presupuesto.
   */
  async generarPresupuestoPDF(presupuestoId: number): Promise<PDFComprobante> {
    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: presupuestoId },
      include: {
        lineas: { include: { producto: { select: { codigo: true, nombre: true } } }, orderBy: { orden: "asc" } },
        cliente: true,
        empresa: true,
        vendedor: true,
        condicionPago: true,
      },
    })

    if (!presupuesto) throw new Error("Presupuesto no encontrado")

    const empresa = presupuesto.empresa
    const cliente = presupuesto.cliente
    const fecha = new Date(presupuesto.fechaEmision).toLocaleDateString("es-AR")
    const vto = presupuesto.fechaVencimiento ? new Date(presupuesto.fechaVencimiento).toLocaleDateString("es-AR") : "—"

    const lineasHTML = (presupuesto.lineas ?? []).map((l) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.producto?.codigo ?? ""}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.descripcion ?? l.producto?.nombre ?? ""}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(l.cantidad).toFixed(2)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(l.precioUnitario).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        ${Number(l.descuentoPct) > 0 ? `<td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: center;">${Number(l.descuentoPct)}%</td>` : '<td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: center;">—</td>'}
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(l.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("")

    const estadoBadge = {
      borrador: "📝 BORRADOR",
      enviado: "📤 ENVIADO",
      aceptado: "✅ ACEPTADO",
      rechazado: "❌ RECHAZADO",
      vencido: "⏰ VENCIDO",
      facturado: "🧾 FACTURADO",
    }[presupuesto.estado] ?? presupuesto.estado.toUpperCase()

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Presupuesto ${presupuesto.numero}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none !important; } .watermark { display: ${presupuesto.estado === "borrador" ? "block" : "none"} !important; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 12px; position: relative; }
    .watermark { position: fixed; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; font-weight: bold; color: rgba(0,0,0,0.06); z-index: 0; pointer-events: none; }
    .header { border: 2px solid #2563eb; padding: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    .empresa-nombre { font-size: 18px; font-weight: bold; }
    .titulo { font-size: 20px; font-weight: bold; color: #2563eb; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #dbeafe; color: #2563eb; }
    .dato { font-size: 11px; color: #555; line-height: 1.6; }
    .seccion { border: 1px solid #ccc; padding: 10px 14px; margin-bottom: 12px; }
    .seccion-titulo { font-weight: bold; font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #eff6ff; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #2563eb; border-bottom: 2px solid #93c5fd; }
    .totales { text-align: right; padding-top: 8px; }
    .totales-row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; }
    .totales-row.total { font-size: 16px; font-weight: bold; border-top: 2px solid #2563eb; padding-top: 8px; color: #2563eb; }
    .condiciones { margin-top: 16px; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; }
    .firma { margin-top: 60px; display: flex; justify-content: space-between; }
    .firma-linea { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 4px; font-size: 10px; }
    .btn-print { position: fixed; top: 10px; right: 10px; background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  ${presupuesto.estado === "borrador" ? '<div class="watermark">BORRADOR</div>' : ""}
  <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir</button>

  <div class="header">
    <div>
      <div class="empresa-nombre">${empresa?.razonSocial ?? empresa?.nombre ?? "Empresa"}</div>
      <div class="dato">CUIT: ${empresa?.cuit ?? "—"}</div>
      <div class="dato">Cond. IVA: ${empresa?.condicionIva ?? "—"}</div>
      <div class="dato">${empresa?.direccion ?? ""}</div>
    </div>
    <div style="text-align: right;">
      <div class="titulo">PRESUPUESTO</div>
      <div style="font-size: 16px; font-weight: bold;">Nº ${presupuesto.numero}</div>
      <div class="dato">Fecha: ${fecha}</div>
      <div class="dato">Válido hasta: ${vto}</div>
      <div class="badge">${estadoBadge}</div>
    </div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">Datos del cliente</div>
    <div class="dato"><strong>${cliente?.nombre ?? "—"}</strong></div>
    <div class="dato">CUIT: ${cliente?.cuit ?? "—"} — ${cliente?.condicionIva ?? ""}</div>
    <div class="dato">${cliente?.direccion ?? ""} ${cliente?.email ? `— ${cliente.email}` : ""}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 60px;">Cód.</th>
        <th>Descripción</th>
        <th style="text-align: right; width: 80px;">Cant.</th>
        <th style="text-align: right; width: 100px;">P. Unit.</th>
        <th style="text-align: center; width: 60px;">Desc.</th>
        <th style="text-align: right; width: 110px;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${lineasHTML}</tbody>
  </table>

  <div class="totales">
    <div class="totales-row"><span>Subtotal:</span> <span>$${Number(presupuesto.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
    ${Number(presupuesto.descuentoPct) > 0 ? `<div class="totales-row"><span>Descuento ${Number(presupuesto.descuentoPct)}%:</span> <span>-$${(Number(presupuesto.subtotal) * Number(presupuesto.descuentoPct) / 100).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>` : ""}
    <div class="totales-row"><span>Impuestos:</span> <span>$${Number(presupuesto.impuestos).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
    <div class="totales-row total"><span>TOTAL:</span> <span>$${Number(presupuesto.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
  </div>

  <div class="condiciones">
    <div class="seccion-titulo">Condiciones</div>
    <div class="dato">${presupuesto.condicionPago ? `Pago: ${presupuesto.condicionPago.nombre}` : ""}</div>
    <div class="dato">${presupuesto.vendedor ? `Vendedor: ${presupuesto.vendedor.nombre}` : ""}</div>
    ${presupuesto.observaciones ? `<div class="dato" style="margin-top: 4px;">Obs.: ${presupuesto.observaciones}</div>` : ""}
  </div>

  <div class="firma">
    <div class="firma-linea">Firma vendedor</div>
    <div class="firma-linea">Firma / conformidad cliente</div>
  </div>
</body>
</html>`

    return {
      html,
      filename: `presupuesto_${presupuesto.numero}.html`,
      metadata: {
        tipo: "Presupuesto",
        numero: presupuesto.numero,
        fecha,
        total: Number(presupuesto.total),
        cae: "",
      },
    }
  }

  /**
   * Genera PDF para Orden de Compra.
   */
  async generarOCPDF(ocId: number): Promise<PDFComprobante> {
    const oc = await prisma.ordenCompra.findUnique({
      where: { id: ocId },
      include: {
        lineas: { include: { producto: { select: { codigo: true, nombre: true } } }, orderBy: { orden: "asc" } },
        proveedor: true,
        empresa: true,
        condicionPago: true,
      },
    })

    if (!oc) throw new Error("Orden de Compra no encontrada")

    const empresa = oc.empresa
    const proveedor = oc.proveedor
    const fecha = new Date(oc.fechaEmision).toLocaleDateString("es-AR")
    const fechaEntrega = oc.fechaEntregaEst ? new Date(oc.fechaEntregaEst).toLocaleDateString("es-AR") : "—"

    const lineasHTML = (oc.lineas ?? []).map((l) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.producto?.codigo ?? ""}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.descripcion ?? l.producto?.nombre ?? ""}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(l.cantidad).toFixed(2)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(l.cantidadRecibida).toFixed(2)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(l.precioUnitario).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">$${Number(l.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("")

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Orden de Compra ${oc.numero}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none !important; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 12px; }
    .header { border: 2px solid #7c3aed; padding: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    .empresa-nombre { font-size: 18px; font-weight: bold; }
    .titulo { font-size: 20px; font-weight: bold; color: #7c3aed; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #ede9fe; color: #7c3aed; }
    .dato { font-size: 11px; color: #555; line-height: 1.6; }
    .seccion { border: 1px solid #ccc; padding: 10px 14px; margin-bottom: 12px; }
    .seccion-titulo { font-weight: bold; font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f5f3ff; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #7c3aed; border-bottom: 2px solid #c4b5fd; }
    .totales { text-align: right; padding-top: 8px; }
    .totales-row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; }
    .totales-row.total { font-size: 16px; font-weight: bold; border-top: 2px solid #7c3aed; padding-top: 8px; color: #7c3aed; }
    .firma { margin-top: 60px; display: flex; justify-content: space-between; }
    .firma-linea { border-top: 1px solid #333; width: 180px; text-align: center; padding-top: 4px; font-size: 10px; }
    .btn-print { position: fixed; top: 10px; right: 10px; background: #7c3aed; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir</button>

  <div class="header">
    <div>
      <div class="empresa-nombre">${empresa?.razonSocial ?? empresa?.nombre ?? "Empresa"}</div>
      <div class="dato">CUIT: ${empresa?.cuit ?? "—"}</div>
      <div class="dato">${empresa?.direccion ?? ""}</div>
    </div>
    <div style="text-align: right;">
      <div class="titulo">ORDEN DE COMPRA</div>
      <div style="font-size: 16px; font-weight: bold;">Nº ${oc.numero}</div>
      <div class="dato">Fecha: ${fecha}</div>
      <div class="dato">Entrega est.: ${fechaEntrega}</div>
      <div class="badge">${oc.estado.toUpperCase()}</div>
    </div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">Proveedor</div>
    <div class="dato"><strong>${proveedor?.nombre ?? "—"}</strong></div>
    <div class="dato">CUIT: ${proveedor?.cuit ?? "—"} — ${proveedor?.condicionIva ?? ""}</div>
    <div class="dato">${proveedor?.direccion ?? ""} ${proveedor?.email ? `— ${proveedor.email}` : ""}</div>
    <div class="dato">${proveedor?.telefono ? `Tel: ${proveedor.telefono}` : ""}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 60px;">Cód.</th>
        <th>Descripción</th>
        <th style="text-align: right; width: 80px;">Cant.</th>
        <th style="text-align: right; width: 80px;">Recibido</th>
        <th style="text-align: right; width: 100px;">P. Unit.</th>
        <th style="text-align: right; width: 110px;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${lineasHTML}</tbody>
  </table>

  <div class="totales">
    <div class="totales-row"><span>Subtotal:</span> <span>$${Number(oc.subtotal).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
    <div class="totales-row"><span>Impuestos:</span> <span>$${Number(oc.impuestos).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
    <div class="totales-row total"><span>TOTAL:</span> <span>$${Number(oc.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span></div>
  </div>

  <div style="margin-top: 16px; padding: 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px;">
    <div class="seccion-titulo">Condiciones</div>
    ${oc.condicionPago ? `<div class="dato">Pago: ${oc.condicionPago.nombre}</div>` : ""}
    ${oc.observaciones ? `<div class="dato">Obs.: ${oc.observaciones}</div>` : ""}
  </div>

  <div class="firma">
    <div class="firma-linea">Solicitado por</div>
    <div class="firma-linea">Aprobado por</div>
    <div class="firma-linea">Recibido conf. proveedor</div>
  </div>
</body>
</html>`

    return {
      html,
      filename: `oc_${oc.numero}.html`,
      metadata: {
        tipo: "Orden de Compra",
        numero: oc.numero,
        fecha,
        total: Number(oc.total),
        cae: "",
      },
    }
  }

  /**
   * Genera PDF para Remito de Transferencia entre depósitos.
   */
  async generarRemitoTransferenciaPDF(transferenciaId: number): Promise<PDFComprobante> {
    const transferencia = await prisma.transferenciaDeposito.findUnique({
      where: { id: transferenciaId },
      include: {
        lineas: { include: { producto: { select: { codigo: true, nombre: true } } } },
        origen: true,
        destino: true,
      },
    })

    if (!transferencia) throw new Error("Transferencia no encontrada")

    const fecha = new Date(transferencia.fecha).toLocaleDateString("es-AR")

    const lineasHTML = (transferencia.lineas ?? []).map((l) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.producto?.codigo ?? ""}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.descripcion ?? l.producto?.nombre ?? ""}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(l.cantidad)}</td>
      </tr>
    `).join("")

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Remito de Transferencia ${transferencia.numero}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none !important; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 12px; }
    .header { border: 2px solid #0891b2; padding: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    .titulo { font-size: 20px; font-weight: bold; color: #0891b2; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #cffafe; color: #0891b2; }
    .dato { font-size: 11px; color: #555; line-height: 1.6; }
    .deposito-box { border: 1px solid #ccc; padding: 10px 14px; flex: 1; }
    .deposito-arrow { display: flex; align-items: center; justify-content: center; padding: 0 12px; font-size: 24px; color: #0891b2; }
    .depositos { display: flex; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #ecfeff; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #0891b2; border-bottom: 2px solid #67e8f9; }
    .firma { margin-top: 60px; display: flex; justify-content: space-between; }
    .firma-linea { border-top: 1px solid #333; width: 180px; text-align: center; padding-top: 4px; font-size: 10px; }
    .btn-print { position: fixed; top: 10px; right: 10px; background: #0891b2; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir</button>

  <div class="header">
    <div>
      <div class="titulo">REMITO DE TRANSFERENCIA</div>
      <div style="font-size: 16px; font-weight: bold;">Nº ${transferencia.numero}</div>
    </div>
    <div style="text-align: right;">
      <div class="dato">Fecha: ${fecha}</div>
      <div class="badge">${transferencia.estado.toUpperCase()}</div>
    </div>
  </div>

  <div class="depositos">
    <div class="deposito-box">
      <div style="font-weight: bold; font-size: 11px; color: #555; text-transform: uppercase; margin-bottom: 4px;">Depósito origen</div>
      <div class="dato"><strong>${transferencia.origen.nombre}</strong></div>
      <div class="dato">${transferencia.origen.direccion ?? ""}</div>
    </div>
    <div class="deposito-arrow">→</div>
    <div class="deposito-box">
      <div style="font-weight: bold; font-size: 11px; color: #555; text-transform: uppercase; margin-bottom: 4px;">Depósito destino</div>
      <div class="dato"><strong>${transferencia.destino.nombre}</strong></div>
      <div class="dato">${transferencia.destino.direccion ?? ""}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 80px;">Cód.</th>
        <th>Producto / Descripción</th>
        <th style="text-align: right; width: 100px;">Cantidad</th>
      </tr>
    </thead>
    <tbody>${lineasHTML}</tbody>
  </table>

  ${transferencia.observaciones ? `<div class="dato" style="margin-top: 12px;">Observaciones: ${transferencia.observaciones}</div>` : ""}

  <div class="firma">
    <div class="firma-linea">Despachado por (Origen)</div>
    <div class="firma-linea">Transportista</div>
    <div class="firma-linea">Recibido por (Destino)</div>
  </div>
</body>
</html>`

    return {
      html,
      filename: `remito_transferencia_${transferencia.numero}.html`,
      metadata: {
        tipo: "Remito de Transferencia",
        numero: transferencia.numero,
        fecha,
        total: 0,
        cae: "",
      },
    }
  }

  /**
   * Genera PDF para Remito de Entrada (recepción de compra).
   */
  async generarRemitoEntradaPDF(recepcionId: number): Promise<PDFComprobante> {
    const recepcion = await prisma.recepcionCompra.findUnique({
      where: { id: recepcionId },
      include: {
        ordenCompra: {
          include: {
            proveedor: true,
            empresa: true,
            lineas: { include: { producto: { select: { codigo: true, nombre: true } } } },
          },
        },
      },
    })

    if (!recepcion) throw new Error("Recepción de compra no encontrada")

    const oc = recepcion.ordenCompra
    const empresa = oc.empresa
    const proveedor = oc.proveedor
    const fecha = new Date(recepcion.fecha).toLocaleDateString("es-AR")

    const lineasHTML = (oc.lineas ?? []).map((l) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.producto?.codigo ?? ""}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.descripcion ?? l.producto?.nombre ?? ""}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(l.cantidad).toFixed(2)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(l.cantidadRecibida).toFixed(2)}</td>
      </tr>
    `).join("")

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Remito de Entrada — OC ${oc.numero}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none !important; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 12px; }
    .header { border: 2px solid #16a34a; padding: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    .titulo { font-size: 20px; font-weight: bold; color: #16a34a; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #dcfce7; color: #16a34a; }
    .dato { font-size: 11px; color: #555; line-height: 1.6; }
    .seccion { border: 1px solid #ccc; padding: 10px 14px; margin-bottom: 12px; }
    .seccion-titulo { font-weight: bold; font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0fdf4; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #16a34a; border-bottom: 2px solid #86efac; }
    .firma { margin-top: 60px; display: flex; justify-content: space-between; }
    .firma-linea { border-top: 1px solid #333; width: 180px; text-align: center; padding-top: 4px; font-size: 10px; }
    .btn-print { position: fixed; top: 10px; right: 10px; background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir</button>

  <div class="header">
    <div>
      <div class="titulo">REMITO DE ENTRADA</div>
      <div style="font-size: 14px; font-weight: bold;">Recepción de OC Nº ${oc.numero}</div>
    </div>
    <div style="text-align: right;">
      <div class="dato">Fecha recepción: ${fecha}</div>
      <div class="badge">${recepcion.estado?.toUpperCase() ?? "RECIBIDO"}</div>
    </div>
  </div>

  <div style="display: flex; gap: 12px; margin-bottom: 16px;">
    <div class="seccion" style="flex: 1;">
      <div class="seccion-titulo">Empresa receptora</div>
      <div class="dato"><strong>${empresa?.razonSocial ?? empresa?.nombre ?? "—"}</strong></div>
      <div class="dato">CUIT: ${empresa?.cuit ?? "—"}</div>
    </div>
    <div class="seccion" style="flex: 1;">
      <div class="seccion-titulo">Proveedor</div>
      <div class="dato"><strong>${proveedor?.nombre ?? "—"}</strong></div>
      <div class="dato">CUIT: ${proveedor?.cuit ?? "—"}</div>
      <div class="dato">${proveedor?.telefono ? `Tel: ${proveedor.telefono}` : ""}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 80px;">Cód.</th>
        <th>Producto / Descripción</th>
        <th style="text-align: right; width: 100px;">Pedido</th>
        <th style="text-align: right; width: 100px;">Recibido</th>
      </tr>
    </thead>
    <tbody>${lineasHTML}</tbody>
  </table>

  ${recepcion.observaciones ? `<div class="dato" style="margin-top: 12px;">Observaciones: ${recepcion.observaciones}</div>` : ""}

  <div class="firma">
    <div class="firma-linea">Entregado por (Proveedor)</div>
    <div class="firma-linea">Recibido por (Depósito)</div>
    <div class="firma-linea">Control Calidad</div>
  </div>
</body>
</html>`

    return {
      html,
      filename: `remito_entrada_oc_${oc.numero}.html`,
      metadata: {
        tipo: "Remito de Entrada",
        numero: oc.numero,
        fecha,
        total: 0,
        cae: "",
      },
    }
  }

  /**
   * Genera un remito como HTML imprimible.
   */
  async generarRemitoPDF(remitoId: number): Promise<PDFComprobante> {
    const remito = await prisma.remito.findUnique({
      where: { id: remitoId },
      include: {
        lineas: true,
        cliente: true,
      },
    })

    if (!remito) throw new Error("Remito no encontrado")

    const fecha = new Date(remito.createdAt).toLocaleDateString("es-AR")
    const numero = String(remito.numero).padStart(8, "0")

    const lineasHTML = (remito.lineas ?? []).map((l) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.descripcion}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right;">${Number(l.cantidad)}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${l.unidad ?? "u"}</td>
      </tr>
    `).join("")

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Remito ${numero}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none !important; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; font-size: 12px; }
    .header { border: 2px solid #333; padding: 16px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    .titulo { font-size: 20px; font-weight: bold; }
    .dato { font-size: 11px; color: #555; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; text-align: left; padding: 8px; font-size: 11px; border-bottom: 2px solid #ccc; }
    .firma { margin-top: 60px; display: flex; justify-content: space-between; }
    .firma-linea { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 4px; font-size: 10px; }
    .btn-print { position: fixed; top: 10px; right: 10px; background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir</button>

  <div class="header">
    <div>
      <div class="titulo">REMITO</div>
      <div class="dato">Nº ${numero}</div>
      <div class="dato">Fecha: ${fecha}</div>
    </div>
    <div style="text-align: right;">
      <div class="dato"><strong>${remito.cliente?.nombre ?? "—"}</strong></div>
      <div class="dato">CUIT: ${remito.cliente?.cuit ?? "—"}</div>
      <div class="dato">${remito.cliente?.direccion ?? ""}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descripción</th>
        <th style="text-align: right; width: 100px;">Cantidad</th>
        <th style="width: 80px;">Unidad</th>
      </tr>
    </thead>
    <tbody>${lineasHTML}</tbody>
  </table>

  ${remito.observaciones ? `<div class="dato" style="margin-top: 8px;">Obs.: ${remito.observaciones}</div>` : ""}

  <div class="firma">
    <div class="firma-linea">Firma emisor</div>
    <div class="firma-linea">Firma receptor</div>
    <div class="firma-linea">Aclaración</div>
  </div>
</body>
</html>`

    return {
      html,
      filename: `remito_${numero}.html`,
      metadata: {
        tipo: "Remito",
        numero,
        fecha,
        total: 0,
        cae: "",
      },
    }
  }
}

export const pdfService = new PDFService()
