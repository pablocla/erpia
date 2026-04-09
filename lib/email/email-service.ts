/**
 * Email/SMTP Service — Sprint 15
 * Transactional email via nodemailer (optional — degrades gracefully when SMTP_* env vars are missing).
 * 
 * Required env vars:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 * Optional:
 *   SMTP_FROM (default: SMTP_USER)
 *   SMTP_SECURE (default: "true" for port 465, otherwise STARTTLS)
 */
import { prisma } from "@/lib/prisma"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
  replyTo?: string
}

export interface EmailResult {
  ok: boolean
  messageId?: string
  error?: string
}

// ─── SMTP Configuration ──────────────────────────────────────────────────────

function getSmtpConfig() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || "587", 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user
  const secure = process.env.SMTP_SECURE === "true" || port === 465

  if (!host || !user || !pass) return null

  return { host, port, user, pass, from: from!, secure }
}

// ─── Lazy nodemailer import (avoids crash if not installed) ──────────────────

let _transporter: any = null

async function getTransporter() {
  if (_transporter) return _transporter

  const config = getSmtpConfig()
  if (!config) return null

  try {
    // @ts-ignore — nodemailer is an optional dependency
    const nodemailer = await import("nodemailer")
    _transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    })
    return _transporter
  } catch {
    console.warn("[EmailService] nodemailer no disponible — emails deshabilitados")
    return null
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const emailService = {
  /**
   * Check if email sending is configured
   */
  isConfigured(): boolean {
    return getSmtpConfig() !== null
  },

  /**
   * Send a single email
   */
  async enviar(options: EmailOptions): Promise<EmailResult> {
    const transporter = await getTransporter()
    if (!transporter) {
      console.warn("[EmailService] SMTP no configurado — email no enviado:", options.subject)
      return { ok: false, error: "SMTP no configurado" }
    }

    const config = getSmtpConfig()!
    try {
      const info = await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || "ERP Argentina"}" <${config.from}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]+>/g, ""),
        replyTo: options.replyTo,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      })

      return { ok: true, messageId: info.messageId }
    } catch (error) {
      console.error("[EmailService] Error al enviar email:", error)
      return { ok: false, error: error instanceof Error ? error.message : "Error desconocido" }
    }
  },

  /**
   * Send invoice PDF by email to the client
   */
  async enviarFactura(facturaId: number, pdfHtml: string): Promise<EmailResult> {
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: { cliente: true, empresa: true },
    })
    if (!factura) return { ok: false, error: "Factura no encontrada" }
    if (!factura.cliente.email) return { ok: false, error: "Cliente sin email" }

    const nroFormatted = `${factura.puntoVenta.toString().padStart(5, "0")}-${factura.numero.toString().padStart(8, "0")}`

    return this.enviar({
      to: factura.cliente.email,
      subject: `Factura ${factura.tipo} ${nroFormatted} — ${factura.empresa.razonSocial}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Comprobante Electrónico</h2>
          <p>Estimado/a <strong>${factura.cliente.nombre}</strong>,</p>
          <p>Adjuntamos su comprobante fiscal:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;">Tipo</td><td style="padding: 8px; border: 1px solid #ddd;">Factura ${factura.tipo}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;">Número</td><td style="padding: 8px; border: 1px solid #ddd;">${nroFormatted}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;">CAE</td><td style="padding: 8px; border: 1px solid #ddd;">${factura.cae || "Pendiente"}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;">Total</td><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">$ ${factura.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td></tr>
          </table>
          <p style="font-size: 12px; color: #666;">
            Este comprobante fue autorizado por AFIP. Puede verificarlo en 
            <a href="https://www.afip.gob.ar/fe/qr/?ver=1&fecha=${factura.createdAt.toISOString().split("T")[0]}&cuit=${factura.empresa.cuit.replace(/-/g, "")}&ptoVta=${factura.puntoVenta}&tipoCmp=${factura.tipoCbte}&nroCmp=${factura.numero}&importe=${factura.total}&moneda=PES&ctz=1&tipoCodAut=E&codAut=${factura.cae || ""}">
              AFIP QR
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 11px; color: #999;">${factura.empresa.razonSocial} — CUIT ${factura.empresa.cuit}<br/>${factura.empresa.direccion || ""}</p>
        </div>
      `,
      attachments: [
        {
          filename: `Factura_${factura.tipo}_${nroFormatted}.html`,
          content: pdfHtml,
          contentType: "text/html",
        },
      ],
    })
  },

  /**
   * Send a nota de crédito by email
   */
  async enviarNotaCredito(ncId: number, pdfHtml: string): Promise<EmailResult> {
    const nc = await prisma.notaCredito.findUnique({
      where: { id: ncId },
      include: { cliente: true, factura: { include: { empresa: true } } },
    })
    if (!nc) return { ok: false, error: "NC no encontrada" }
    if (!nc.cliente.email) return { ok: false, error: "Cliente sin email" }

    const nroFormatted = `${nc.puntoVenta.toString().padStart(5, "0")}-${nc.numero.toString().padStart(8, "0")}`

    return this.enviar({
      to: nc.cliente.email,
      subject: `Nota de Crédito ${nc.tipo} ${nroFormatted} — ${nc.factura.empresa.razonSocial}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Nota de Crédito</h2>
          <p>Estimado/a <strong>${nc.cliente.nombre}</strong>,</p>
          <p>Se emitió la siguiente Nota de Crédito a su favor:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border: 1px solid #ddd;">Tipo</td><td style="padding: 8px; border: 1px solid #ddd;">NC ${nc.tipo}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;">Número</td><td style="padding: 8px; border: 1px solid #ddd;">${nroFormatted}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;">Motivo</td><td style="padding: 8px; border: 1px solid #ddd;">${nc.motivo}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #ddd;">Total</td><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; color: #dc2626;">$ ${nc.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 11px; color: #999;">${nc.factura.empresa.razonSocial} — CUIT ${nc.factura.empresa.cuit}</p>
        </div>
      `,
      attachments: [
        {
          filename: `NC_${nc.tipo}_${nroFormatted}.html`,
          content: pdfHtml,
          contentType: "text/html",
        },
      ],
    })
  },

  /**
   * Send a generic notification email
   */
  async notificar(to: string, subject: string, body: string): Promise<EmailResult> {
    return this.enviar({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${subject}</h2>
          <div>${body}</div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="font-size: 11px; color: #999;">ERP Argentina — Notificación automática</p>
        </div>
      `,
    })
  },
}
