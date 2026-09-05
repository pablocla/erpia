/**
 * Utilidades de certificados AFIP: PEM, PKCS#12 (.p12/.pfx), vencimiento.
 */

import forge from "node-forge"

export interface ParsedCertPair {
  /** PEM certificate (BEGIN CERTIFICATE) */
  certPem: string
  /** PEM private key */
  keyPem: string
  /** Base64 of cert PEM (formato storage ERP) */
  certificadoCRT: string
  /** Base64 of key PEM */
  certificadoKEY: string
  notBefore?: Date
  notAfter?: Date
  subjectCn?: string
}

function toStorageBase64(pem: string): string {
  return Buffer.from(pem, "utf8").toString("base64")
}

/**
 * Parsea PKCS#12 (.p12 / .pfx) en memoria y extrae cert + private key.
 */
export function parsePkcs12(
  p12Buffer: Buffer,
  password: string,
): ParsedCertPair {
  const binary = p12Buffer.toString("binary")
  const asn1 = forge.asn1.fromDer(binary)
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password)

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[
    forge.pki.oids.certBag
  ]
  const keyBags =
    p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
      forge.pki.oids.pkcs8ShroudedKeyBag
    ] ?? p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]

  if (!certBags?.length || !keyBags?.length) {
    throw new Error(
      "PKCS#12 inválido: no se encontró certificado o clave privada",
    )
  }

  const cert = certBags[0].cert
  const key = keyBags[0].key
  if (!cert || !key) {
    throw new Error("PKCS#12: no se pudo extraer cert/key")
  }

  const certPem = forge.pki.certificateToPem(cert)
  const keyPem = forge.pki.privateKeyToPem(key)
  const cnAttr = cert.subject.getField("CN")

  return {
    certPem,
    keyPem,
    certificadoCRT: toStorageBase64(certPem),
    certificadoKEY: toStorageBase64(keyPem),
    notBefore: cert.validity.notBefore,
    notAfter: cert.validity.notAfter,
    subjectCn: cnAttr?.value as string | undefined,
  }
}

/**
 * Lee cert PEM (base64 storage o PEM crudo) y devuelve fechas de vigencia.
 */
export function readCertMeta(certificadoCRT: string): {
  notBefore: Date
  notAfter: Date
  subjectCn?: string
  daysToExpiry: number
  estado: "OK" | "POR_VENCER" | "VENCIDO"
} {
  let pem = certificadoCRT
  if (!pem.includes("BEGIN CERTIFICATE")) {
    pem = Buffer.from(certificadoCRT, "base64").toString("utf8")
  }
  const cert = forge.pki.certificateFromPem(pem)
  const notAfter = cert.validity.notAfter
  const notBefore = cert.validity.notBefore
  const daysToExpiry = Math.ceil(
    (notAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )
  let estado: "OK" | "POR_VENCER" | "VENCIDO" = "OK"
  if (daysToExpiry < 0) estado = "VENCIDO"
  else if (daysToExpiry <= 30) estado = "POR_VENCER"

  const cnAttr = cert.subject.getField("CN")
  return {
    notBefore,
    notAfter,
    subjectCn: cnAttr?.value as string | undefined,
    daysToExpiry,
    estado,
  }
}

/**
 * Normaliza input de upload: PEM crudo o ya-base64 → base64 storage.
 */
export function normalizePemToStorage(pemOrBase64: string): string {
  const trimmed = pemOrBase64.trim()
  if (
    trimmed.includes("BEGIN CERTIFICATE") ||
    trimmed.includes("BEGIN ") ||
    trimmed.includes("PRIVATE KEY")
  ) {
    return Buffer.from(trimmed, "utf8").toString("base64")
  }
  // asumir ya es base64 del PEM
  return trimmed
}

/**
 * Cifrado ligero en reposo de la KEY (opcional, si hay AFIP_CERT_SECRET).
 * Formato: enc:v1:<iv_b64>:<cipher_b64> (AES-256-GCM via WebCrypto no disponible en todos
 * los entornos Node sin crypto nativo — usamos createCipheriv).
 */
export function encryptPrivateKeyIfConfigured(keyBase64: string): string {
  const secret = process.env.AFIP_CERT_SECRET
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 16)) {
    throw new Error(
      "AFIP_CERT_SECRET no está configurado o tiene menos de 16 caracteres en producción. Se requiere obligatoriamente para cifrar claves privadas fiscales.",
    )
  }
  if (!secret || secret.length < 16) {
    console.warn(
      "[AFIP Security Warning] AFIP_CERT_SECRET no configurado. La clave se almacenará sin cifrar (solo permitido en desarrollo).",
    )
    return keyBase64
  }

  // lazy require para no romper edge
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto") as typeof import("crypto")
  const key = crypto.createHash("sha256").update(secret).digest()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
  const enc = Buffer.concat([
    cipher.update(Buffer.from(keyBase64, "utf8")),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return `enc:v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`
}

export function decryptPrivateKeyIfNeeded(stored: string): string {
  if (!stored.startsWith("enc:v1:")) return stored
  const secret = process.env.AFIP_CERT_SECRET
  if (!secret) {
    throw new Error(
      "Clave AFIP cifrada pero AFIP_CERT_SECRET no está configurado",
    )
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto") as typeof import("crypto")
  const parts = stored.split(":")
  // enc:v1:iv:tag:cipher
  if (parts.length < 5) throw new Error("Formato de clave cifrada inválido")
  const iv = Buffer.from(parts[2], "base64")
  const tag = Buffer.from(parts[3], "base64")
  const data = Buffer.from(parts[4], "base64")
  const key = crypto.createHash("sha256").update(secret).digest()
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(data), decipher.final()])
  return dec.toString("utf8")
}
