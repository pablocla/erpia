export type WhatsappTemplateParams = Record<string, string>

const ensureWhatsappNumber = (value: string) => {
  const cleaned = value.replace(/[^0-9+]/g, "")
  if (!cleaned.startsWith("+")) {
    return `+${cleaned}`
  }
  return cleaned
}

const formatRecipient = (value: string) => {
  const normalized = ensureWhatsappNumber(value)
  return normalized.startsWith("whatsapp:") ? normalized : `whatsapp:${normalized}`
}

export class WhatsappService {
  private readonly accountSid: string
  private readonly authToken: string
  private readonly from: string
  private readonly devMode: boolean

  static isConfigured(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_WHATSAPP_FROM
    )
  }

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID ?? ""
    const authToken = process.env.TWILIO_AUTH_TOKEN ?? ""
    const from = process.env.TWILIO_WHATSAPP_FROM ?? ""

    this.devMode = !WhatsappService.isConfigured()
    this.accountSid = accountSid
    this.authToken = authToken
    this.from = from ? ensureWhatsappNumber(from) : ""
  }

  private get authorizationHeader() {
    return `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`
  }

  async sendMessage(to: string, body: string) {
    if (this.devMode) {
      console.info(`[WhatsApp DEV] → ${formatRecipient(to)}: ${body.slice(0, 120)}...`)
      return { sid: "dev-mode", status: "queued", to, body }
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`
    const payload = new URLSearchParams()
    payload.append("From", `whatsapp:${this.from}`)
    payload.append("To", formatRecipient(to))
    payload.append("Body", body)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.authorizationHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Twilio error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  async sendTemplate(to: string, templateName: string, params: WhatsappTemplateParams = {}) {
    const body = Object.entries(params).reduce(
      (acc, [key, value]) => acc.replace(new RegExp(`{${key}}`, "g"), value),
      templateName,
    )

    return this.sendMessage(to, body)
  }

  /**
   * CTA URL (botón de pago) — Twilio Content API o fallback a texto con link.
   * Preferido para recordatorios de fiado con Mercado Pago.
   */
  async sendInteractiveCtaUrl(input: {
    to: string
    body: string
    displayText: string
    url: string
  }) {
    const contentSid = process.env.TWILIO_WHATSAPP_CTA_CONTENT_SID

    if (this.devMode) {
      console.info(
        `[WhatsApp DEV CTA] → ${formatRecipient(input.to)} | ${input.displayText} → ${input.url}`,
      )
      return { sid: "dev-mode-cta", status: "queued", to: input.to, url: input.url }
    }

    // Si hay Content SID de plantilla con botón URL, usarlo
    if (contentSid) {
      const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`
      const payload = new URLSearchParams()
      payload.append("From", `whatsapp:${this.from}`)
      payload.append("To", formatRecipient(input.to))
      payload.append("ContentSid", contentSid)
      payload.append(
        "ContentVariables",
        JSON.stringify({
          1: input.body.slice(0, 500),
          2: input.displayText.slice(0, 20),
          3: input.url,
        }),
      )

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: this.authorizationHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload.toString(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        // Fallback a texto plano si la plantilla falla
        console.warn("[WhatsApp] CTA Content API falló, fallback texto:", errorText)
        return this.sendMessage(input.to, `${input.body}\n\n${input.displayText}: ${input.url}`)
      }

      return response.json()
    }

    // Fallback: mensaje con link clickeable (funciona en todos los números WA)
    return this.sendMessage(input.to, `${input.body}\n\n👉 ${input.displayText}:\n${input.url}`)
  }

  /**
   * WhatsApp Cloud API nativa (Meta) — botones interactivos URL.
   * Activo si WHATSAPP_CLOUD_TOKEN + WHATSAPP_PHONE_NUMBER_ID están configurados.
   */
  static isCloudApiConfigured(): boolean {
    return Boolean(
      process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
    )
  }

  static async sendCloudApiCtaUrl(input: {
    to: string
    body: string
    displayText: string
    url: string
  }) {
    const token = process.env.WHATSAPP_CLOUD_TOKEN
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
    if (!token || !phoneId) {
      throw new Error("WhatsApp Cloud API no configurada")
    }

    const toDigits = input.to.replace(/[^0-9]/g, "")
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toDigits,
        type: "interactive",
        interactive: {
          type: "cta_url",
          body: { text: input.body.slice(0, 1024) },
          action: {
            name: "cta_url",
            parameters: {
              display_text: input.displayText.slice(0, 20),
              url: input.url,
            },
          },
        },
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`WhatsApp Cloud API error: ${res.status} ${err}`)
    }
    return res.json()
  }
}
