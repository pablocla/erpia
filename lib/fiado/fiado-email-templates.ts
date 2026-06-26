import { emailLayout } from "@/lib/email/email-templates"

export function emailFiadoNotificacion(opts: {
  almacen: string
  clienteNombre: string
  numeroCompleto: string
  lineas: { descripcion: string; cantidad: number; total: number }[]
  totalVenta: number
  deudaTotal: number
  creditoDisponible: number | null
  linkPago?: string | null
  fmt: (n: number) => string
}): string {
  const filas = opts.lineas
    .map(
      (l) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${l.descripcion}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">${l.cantidad}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${opts.fmt(l.total)}</td>
        </tr>`,
    )
    .join("")

  const disponible =
    opts.creditoDisponible != null
      ? `<p style="margin:8px 0 0;"><strong>Crédito disponible:</strong> ${opts.fmt(opts.creditoDisponible)}</p>`
      : ""

  return emailLayout(
    `
    <h2 style="margin:0 0 8px;font-size:18px;">Compra a fiado</h2>
    <p style="margin:0 0 16px;color:#64748b;font-size:14px;">${opts.almacen} · ${opts.numeroCompleto}</p>
    <p style="margin:0 0 12px;">El cliente <strong>${opts.clienteNombre}</strong> registró una compra a fiado:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:16px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px;text-align:left;">Producto</th>
          <th style="padding:8px;text-align:center;">Cant.</th>
          <th style="padding:8px;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    <p style="margin:0 0 4px;"><strong>Total esta venta:</strong> ${opts.fmt(opts.totalVenta)}</p>
    <p style="margin:0 0 4px;color:#dc2626;"><strong>Deuda total:</strong> ${opts.fmt(opts.deudaTotal)}</p>
    ${disponible}
    ${
      opts.linkPago
        ? `<p style="margin:16px 0 0;"><a href="${opts.linkPago}" style="display:inline-block;background:#1D4ED8;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">Pagar con MercadoPago</a></p>`
        : ""
    }
    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">Clavis by Claver — Libreta Fiado</p>
  `,
    { preheader: `${opts.clienteNombre} fiado ${opts.fmt(opts.totalVenta)}` },
  )
}