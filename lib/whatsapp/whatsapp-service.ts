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

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_WHATSAPP_FROM

    if (!accountSid || !authToken || !from) {
      throw new Error("TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN y TWILIO_WHATSAPP_FROM deben estar configurados")
    }

    this.accountSid = accountSid
    this.authToken = authToken
    this.from = ensureWhatsappNumber(from)
  }

  private get authorizationHeader() {
    return `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`
  }

  async sendMessage(to: string, body: string) {
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
}
