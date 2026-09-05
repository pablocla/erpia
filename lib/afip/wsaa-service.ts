/**
 * WSAA — autenticación multi-servicio con cache de Ticket de Acceso (TA).
 *
 * Cada webservice AFIP requiere un TRA con <service> distinto.
 * El TA es reutilizable ~12h; cacheamos por cuit+service+entorno.
 */

import soap from "soap"
import forge from "node-forge"
import { decryptPrivateKeyIfNeeded } from "./cert-utils"

export type AfipEntorno = "homologacion" | "produccion"

/** Nombres oficiales del atributo service del TRA */
export type AfipWsaaService =
  | "wsfe"
  | "wsfex"
  | "wsfecred"
  | "wscdc"
  | "ws_sr_padron_a5"
  | "ws_sr_padron_a13"

export interface AFIPAuthResponse {
  token: string
  sign: string
  expirationTime: Date
  service: AfipWsaaService
}

interface CacheEntry {
  auth: AFIPAuthResponse
  /** Renovar 5 min antes del vencimiento */
  refreshAt: number
}

const TA_CACHE = new Map<string, CacheEntry>()
/** Margen de seguridad antes de expiración (ms) */
const TA_SAFETY_MS = 5 * 60 * 1000

function wsaaUrl(entorno: AfipEntorno): string {
  return entorno === "produccion"
    ? "https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl"
    : "https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl"
}

function cacheKey(
  cuit: string,
  service: AfipWsaaService,
  entorno: AfipEntorno,
): string {
  return `${cuit.replace(/\D/g, "")}:${service}:${entorno}`
}

function createTRA(service: AfipWsaaService): string {
  const now = new Date()
  // AFIP recomienda generationTime en el pasado cercano y expiration ~12h
  const generationTime = new Date(now.getTime() - 10 * 60 * 1000)
  const expirationTime = new Date(now.getTime() + 12 * 60 * 60 * 1000)

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
    <generationTime>${generationTime.toISOString()}</generationTime>
    <expirationTime>${expirationTime.toISOString()}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`
}

/**
 * Firma CMS (PKCS#7) del TRA. AFIP exige signed-data attached (no detached).
 */
export function signTRA(
  tra: string,
  certificadoBase64: string,
  privateKeyBase64: string,
): string {
  const decryptedKeyBase64 = decryptPrivateKeyIfNeeded(privateKeyBase64)
  const certPem = Buffer.from(certificadoBase64, "base64").toString("utf8")
  const keyPem = Buffer.from(decryptedKeyBase64, "base64").toString("utf8")

  const cert = forge.pki.certificateFromPem(certPem)
  const pkey = forge.pki.privateKeyFromPem(keyPem)

  const p7 = forge.pkcs7.createSignedData()
  p7.content = forge.util.createBuffer(tra, "utf8")
  p7.addCertificate(cert)
  p7.addSigner({
    key: pkey,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.signingTime, value: new Date() as any },
      { type: forge.pki.oids.messageDigest },
    ],
  })
  p7.sign({ detached: false })

  const der = forge.asn1.toDer(p7.toAsn1()).getBytes()
  return forge.util.encode64(der)
}

/**
 * Parsea respuesta loginCmsReturn (puede venir como XML string o objeto).
 */
function parseLoginCmsReturn(raw: unknown): {
  token: string
  sign: string
  expirationTime: Date
} {
  if (raw && typeof raw === "object" && "token" in (raw as object)) {
    const o = raw as { token: string; sign: string; expirationTime: string }
    return {
      token: o.token,
      sign: o.sign,
      expirationTime: new Date(o.expirationTime),
    }
  }

  const xml = String(raw ?? "")
  const token = xml.match(/<token>([\s\S]*?)<\/token>/i)?.[1]?.trim()
  const sign = xml.match(/<sign>([\s\S]*?)<\/sign>/i)?.[1]?.trim()
  const exp =
    xml.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/i)?.[1]?.trim()

  if (!token || !sign) {
    throw new Error("WSAA: respuesta sin token/sign")
  }

  return {
    token,
    sign,
    expirationTime: exp ? new Date(exp) : new Date(Date.now() + 10 * 60 * 60 * 1000),
  }
}

export async function loginCms(
  entorno: AfipEntorno,
  certificadoBase64: string,
  privateKeyBase64: string,
  service: AfipWsaaService,
): Promise<AFIPAuthResponse> {
  const client = await soap.createClientAsync(wsaaUrl(entorno))
  const tra = createTRA(service)
  const cms = signTRA(tra, certificadoBase64, privateKeyBase64)

  const [result] = await client.loginCmsAsync({ in0: cms })
  const credentials = parseLoginCmsReturn(result?.loginCmsReturn)

  return {
    token: credentials.token,
    sign: credentials.sign,
    expirationTime: credentials.expirationTime,
    service,
  }
}

/**
 * Obtiene TA con cache. Si está por vencer, renueva.
 */
export async function getTicketAcceso(params: {
  cuit: string
  certificadoBase64: string
  privateKeyBase64: string
  entorno: AfipEntorno
  service?: AfipWsaaService
  /** Forzar nuevo login (ignora cache) */
  forceRefresh?: boolean
}): Promise<AFIPAuthResponse> {
  const service = params.service ?? "wsfe"
  const key = cacheKey(params.cuit, service, params.entorno)
  const now = Date.now()

  if (!params.forceRefresh) {
    const hit = TA_CACHE.get(key)
    if (hit && hit.refreshAt > now) {
      return hit.auth
    }
  }

  try {
    const auth = await loginCms(
      params.entorno,
      params.certificadoBase64,
      params.privateKeyBase64,
      service,
    )
    TA_CACHE.set(key, {
      auth,
      refreshAt: auth.expirationTime.getTime() - TA_SAFETY_MS,
    })
    return auth
  } catch (error) {
    console.error(`[WSAA] loginCms falló service=${service}:`, error)
    const msg = error instanceof Error ? error.message : String(error)
    throw new Error(`Error al autenticar con AFIP (WSAA/${service}): ${msg}`)
  }
}

/** Invalida cache (útil en tests o tras error de token) */
export function invalidateTaCache(
  cuit?: string,
  service?: AfipWsaaService,
  entorno?: AfipEntorno,
): void {
  if (!cuit) {
    TA_CACHE.clear()
    return
  }
  const prefix = cuit.replace(/\D/g, "")
  for (const k of TA_CACHE.keys()) {
    if (!k.startsWith(prefix)) continue
    if (service && !k.includes(`:${service}:`)) continue
    if (entorno && !k.endsWith(`:${entorno}`)) continue
    TA_CACHE.delete(k)
  }
}

export function getTaCacheStats(): { size: number; keys: string[] } {
  return { size: TA_CACHE.size, keys: [...TA_CACHE.keys()] }
}
