import { BRAND_EMAIL_FOOTER, BRAND_FULL, CLAVER_GROUP, CLAVERP_PRODUCT } from "@/lib/brand"

const BRAND_PRIMARY = "#1D4ED8"
const BRAND_ACCENT = "#F59E0B"

export function emailLayout(content: string, options?: { preheader?: string }): string {
  const preheader = options?.preheader
    ? `<span style="display:none;max-height:0;overflow:hidden">${options.preheader}</span>`
    : ""

  return `
<!DOCTYPE html>
<html lang="es-AR">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Manrope,Arial,sans-serif;">
  ${preheader}
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_PRIMARY},#1e3a8a);padding:20px 28px;">
              <table width="100%"><tr>
                <td>
                  <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">${CLAVERP_PRODUCT.name}</p>
                  <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.85);">by ${CLAVER_GROUP.name}</p>
                </td>
                <td align="right" valign="middle">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${BRAND_ACCENT};"></span>
                </td>
              </tr></table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#0f172a;font-size:15px;line-height:1.6;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">${BRAND_EMAIL_FOOTER}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function emailNotificationBody(subject: string, body: string): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">${subject}</h2>
    <div>${body}</div>
  `)
}

export function emailFacturaIntro(clienteNombre: string): string {
  return `<p style="margin:0 0 12px;">Estimado/a <strong>${clienteNombre}</strong>,</p>
    <p style="margin:0 0 16px;">Adjuntamos su comprobante fiscal emitido desde <strong>${BRAND_FULL}</strong>:</p>`
}

export function emailNotaCreditoIntro(clienteNombre: string): string {
  return `<p style="margin:0 0 12px;">Estimado/a <strong>${clienteNombre}</strong>,</p>
    <p style="margin:0 0 16px;">Se emitió la siguiente Nota de Crédito a su favor:</p>`
}