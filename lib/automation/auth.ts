import { type NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifySignature, type SignedEnvelope } from "./sign-payload"

export interface AutomationAuthContext {
  empresaId: number
  via: "hmac" | "api_key"
}

export async function verifyAutomationRequest(
  request: NextRequest,
  body: SignedEnvelope & Record<string, unknown>
): Promise<
  | { ok: true; auth: AutomationAuthContext }
  | { ok: false; error: string; status: number }
> {
  const empresaIdHeader = request.headers.get("x-nop-empresa-id")
  const apiKey = request.headers.get("x-nop-api-key")

  if (apiKey && empresaIdHeader) {
    const empresaId = parseInt(empresaIdHeader, 10)
    if (Number.isNaN(empresaId)) {
      return { ok: false, error: "empresaId inválido", status: 400 }
    }
    const config = await prisma.automationConfig.findUnique({
      where: { empresaId },
    })
    if (!config) {
      return { ok: false, error: "Automation no configurado", status: 404 }
    }
    const storedKey = config.n8nApiKeyEnc
      ? Buffer.from(config.n8nApiKeyEnc, "base64").toString("utf8")
      : null
    if (!storedKey || storedKey !== apiKey) {
      return { ok: false, error: "API key inválida", status: 401 }
    }
    return { ok: true, auth: { empresaId, via: "api_key" } }
  }

  const empresaId = body.empresaId
  if (!empresaId || typeof body.signature !== "string") {
    return { ok: false, error: "Payload firmado requerido", status: 400 }
  }

  const config = await prisma.automationConfig.findUnique({
    where: { empresaId },
  })
  if (!config) {
    return { ok: false, error: "Automation no configurado", status: 404 }
  }

  if (!verifySignature(config.webhookSecret, body as SignedEnvelope)) {
    return { ok: false, error: "Firma HMAC inválida", status: 401 }
  }

  return { ok: true, auth: { empresaId, via: "hmac" } }
}