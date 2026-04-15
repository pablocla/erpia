import soap from "soap"
import forge from "node-forge"
import { prisma } from "@/lib/prisma"

/** FIX C-006: Guarda request/response de AFIP en BD para auditoría. */
async function logAfip(params: {
  empresaId: number
  webservice: string
  operacion: string
  requestBody?: string
  responseBody?: string
  statusCode?: string
  cae?: string
  facturaId?: number
  duracionMs?: number
  errorMsg?: string
}) {
  try {
    await prisma.afipWebserviceLog.create({ data: params })
  } catch {
    // El log no puede romper el flujo principal
    console.error("[AfipLog] No se pudo guardar log AFIP")
  }
}

export interface AFIPAuthResponse {
  token: string
  sign: string
  expirationTime: Date
}

export class AFIPSoapClient {
  private wsaaUrl: string
  private wsfeUrl: string

  constructor(entorno: "homologacion" | "produccion") {
    if (entorno === "produccion") {
      this.wsaaUrl = "https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl"
      this.wsfeUrl = "https://servicios1.afip.gov.ar/wsfev1/service.asmx?wsdl"
    } else {
      this.wsaaUrl = "https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl"
      this.wsfeUrl = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?wsdl"
    }
  }

  async authenticate(cuit: string, certificado: string, privateKey: string): Promise<AFIPAuthResponse> {
    try {
      const client = await soap.createClientAsync(this.wsaaUrl)

      // Crear el TRA (Ticket de Requerimiento de Acceso)
      const tra = this.createTRA()

      // Firmar el TRA con el certificado
      const cms = this.signTRA(tra, certificado, privateKey)

      // Llamar al servicio de autenticación
      const [result] = await client.loginCmsAsync({
        in0: cms,
      })

      const credentials = result.loginCmsReturn

      return {
        token: credentials.token,
        sign: credentials.sign,
        expirationTime: new Date(credentials.expirationTime),
      }
    } catch (error) {
      console.error("Error en autenticación AFIP:", error)
      throw new Error("Error al autenticar con AFIP")
    }
  }

  async emitirComprobante(
    auth: AFIPAuthResponse,
    cuit: string,
    puntoVenta: number,
    comprobante: any,
    empresaId?: number,
    facturaId?: number,
  ): Promise<any> {
    const t0 = Date.now()
    const requestPayload = { Auth: { Cuit: cuit }, FeCAEReq: { FeCabReq: { PtoVta: puntoVenta, CbteTipo: comprobante.CbteTipo }, FeDetReq: { FECAEDetRequest: comprobante } } }

    try {
      const client = await soap.createClientAsync(this.wsfeUrl)

      const [result] = await client.FECAESolicitarAsync({
        Auth: { Token: auth.token, Sign: auth.sign, Cuit: cuit },
        FeCAEReq: {
          FeCabReq: { CantReg: 1, PtoVta: puntoVenta, CbteTipo: comprobante.CbteTipo },
          FeDetReq: { FECAEDetRequest: comprobante },
        },
      })

      const wsResult = result.FECAESolicitarResult
      const cae = wsResult?.FeDetResp?.FECAEDetResponse?.CAE

      // FIX C-006: Guardar log exitoso
      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFE",
          operacion: "FECAESolicitar",
          requestBody: JSON.stringify(requestPayload),
          responseBody: JSON.stringify(wsResult),
          statusCode: wsResult?.FeDetResp?.FECAEDetResponse?.Resultado ?? "?",
          cae: cae ?? undefined,
          facturaId,
          duracionMs: Date.now() - t0,
        })
      }

      return wsResult
    } catch (error) {
      // FIX C-006: Guardar log de error
      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFE",
          operacion: "FECAESolicitar",
          requestBody: JSON.stringify(requestPayload),
          statusCode: "ERROR",
          duracionMs: Date.now() - t0,
          errorMsg: error instanceof Error ? error.message : String(error),
          facturaId,
        })
      }
      console.error("Error al emitir comprobante:", error)
      throw new Error("Error al emitir comprobante en AFIP")
    }
  }

  async consultarUltimoComprobante(
    auth: AFIPAuthResponse,
    cuit: string,
    puntoVenta: number,
    tipoComprobante: number,
  ): Promise<number> {
    try {
      const client = await soap.createClientAsync(this.wsfeUrl)

      const [result] = await client.FECompUltimoAutorizadoAsync({
        Auth: {
          Token: auth.token,
          Sign: auth.sign,
          Cuit: cuit,
        },
        PtoVta: puntoVenta,
        CbteTipo: tipoComprobante,
      })

      return result.FECompUltimoAutorizadoResult.CbteNro || 0
    } catch (error) {
      console.error("Error al consultar último comprobante:", error)
      return 0
    }
  }

  private createTRA(): string {
    const now = new Date()
    const expirationTime = new Date(now.getTime() + 12 * 60 * 60 * 1000) // 12 horas

    return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Date.now()}</uniqueId>
    <generationTime>${now.toISOString()}</generationTime>
    <expirationTime>${expirationTime.toISOString()}</expirationTime>
  </header>
  <service>wsfe</service>
</loginTicketRequest>`
  }

  private signTRA(tra: string, certificadoBase64: string, privateKeyBase64: string): string {
    // Decode from the base64-stored PEM format back to PEM strings
    const certPem = Buffer.from(certificadoBase64, "base64").toString("utf8")
    const keyPem  = Buffer.from(privateKeyBase64,  "base64").toString("utf8")

    // Build a PKCS#7 / CMS SignedData message — the format AFIP WSAA requires
    const cert = forge.pki.certificateFromPem(certPem)
    const pkey = forge.pki.privateKeyFromPem(keyPem)

    const p7 = forge.pkcs7.createSignedData()
    p7.content = forge.util.createBuffer(tra, "utf8")
    p7.addCertificate(cert)
    p7.addSigner({
      key: pkey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [],
    })
    p7.sign({ detached: false })

    // DER-encode then base64 — this is what loginCms(in0) expects
    const der = forge.asn1.toDer(p7.toAsn1()).getBytes()
    return forge.util.encode64(der)
  }
}
