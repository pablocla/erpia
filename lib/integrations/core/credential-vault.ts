import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto"

const ALGO = "aes-256-gcm"
const IV_LEN = 12
const TAG_LEN = 16

function deriveKey(): Buffer {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY ?? process.env.JWT_SECRET ?? "claverp-dev-integration-key"
  return scryptSync(secret, "claverp-integrations", 32)
}

export function encryptCredentials(data: Record<string, string>): string {
  const key = deriveKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const json = JSON.stringify(data)
  const enc = Buffer.concat([cipher.update(json, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString("base64")
}

export function decryptCredentials(payload: string | null | undefined): Record<string, string> {
  if (!payload) return {}
  try {
    const buf = Buffer.from(payload, "base64")
    const iv = buf.subarray(0, IV_LEN)
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
    const enc = buf.subarray(IV_LEN + TAG_LEN)
    const key = deriveKey()
    const decipher = createDecipheriv(ALGO, key, iv)
    decipher.setAuthTag(tag)
    const dec = Buffer.concat([decipher.update(enc), decipher.final()])
    return JSON.parse(dec.toString("utf8")) as Record<string, string>
  } catch {
    return {}
  }
}

export function maskSecret(value: string | undefined): string {
  if (!value) return ""
  if (value.length <= 4) return "••••"
  return `${value.slice(0, 2)}${"•".repeat(Math.min(8, value.length - 4))}${value.slice(-2)}`
}