import { WhatsappService } from "@/lib/whatsapp/whatsapp-service"
import type { ConnectionContext, IntegrationConnector } from "../types"
import { fail, ok, requireFields } from "./base"

export const whatsappConnector: IntegrationConnector = {
  id: "whatsapp",

  async testConnection(ctx: ConnectionContext) {
    const modo = ctx.credenciales.modo ?? "twilio"

    if (modo === "cloud") {
      const missing = requireFields(ctx, ["accessToken", "phoneNumberId"])
      if (missing) return missing
      try {
        const res = await fetch(
          `https://graph.facebook.com/v19.0/${ctx.credenciales.phoneNumberId}`,
          { headers: { Authorization: `Bearer ${ctx.credenciales.accessToken}` } },
        )
        if (!res.ok) return fail("Credenciales Meta WhatsApp inválidas")
        const data = await res.json() as { display_phone_number?: string }
        return ok(`WhatsApp Cloud: ${data.display_phone_number ?? "verificado"}`)
      } catch {
        return fail("Error al verificar WhatsApp Cloud API")
      }
    }

    if (WhatsappService.isConfigured()) {
      return ok("WhatsApp vía Twilio configurado en servidor")
    }
    return fail("Configurá Twilio (TWILIO_*) o credenciales Meta Cloud API")
  },
}