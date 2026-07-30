/**
 * Cliente SOAP WSFE + bridge WSAA multi-servicio.
 */
import soap from "soap"
import {
  getTicketAcceso,
  type AFIPAuthResponse,
  type AfipEntorno,
  type AfipWsaaService,
} from "./wsaa-service"
import { decryptPrivateKeyIfNeeded } from "./cert-utils"
import { logAfip, serializeAfipPayload } from "./afip-log"

export type { AFIPAuthResponse, AfipWsaaService, AfipEntorno }

export class AFIPSoapClient {
  private wsfeUrl: string
  private entorno: AfipEntorno

  constructor(entorno: AfipEntorno = "homologacion") {
    this.entorno = entorno
    this.wsfeUrl =
      entorno === "produccion"
        ? "https://servicios1.afip.gov.ar/wsfev1/service.asmx?wsdl"
        : "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?wsdl"
  }

  /**
   * Autentica vía WSAA. `service` por defecto "wsfe".
   * Soporta cache de TA y KEY cifrada (AFIP_CERT_SECRET).
   */
  async authenticate(
    cuit: string,
    certificado: string,
    privateKey: string,
    service: AfipWsaaService = "wsfe",
  ): Promise<AFIPAuthResponse> {
    const key = decryptPrivateKeyIfNeeded(privateKey)
    return getTicketAcceso({
      cuit,
      certificadoBase64: certificado,
      privateKeyBase64: key,
      entorno: this.entorno,
      service,
    })
  }

  private authBlock(auth: AFIPAuthResponse, cuit: string) {
    return { Token: auth.token, Sign: auth.sign, Cuit: cuit.replace(/\D/g, "") }
  }

  async emitirComprobante(
    auth: AFIPAuthResponse,
    cuit: string,
    puntoVenta: number,
    comprobante: Record<string, unknown>,
    empresaId?: number,
    facturaId?: number,
  ): Promise<unknown> {
    const t0 = Date.now()
    const FeCAEReq = {
      FeCabReq: {
        CantReg: 1,
        PtoVta: puntoVenta,
        CbteTipo: comprobante.CbteTipo,
      },
      FeDetReq: { FECAEDetRequest: comprobante },
    }
    const requestPayload = {
      Auth: this.authBlock(auth, cuit),
      FeCAEReq,
    }

    try {
      const client = await soap.createClientAsync(this.wsfeUrl)
      const [result] = await client.FECAESolicitarAsync(requestPayload)
      const wsResult = result.FECAESolicitarResult
      const det = wsResult?.FeDetResp?.FECAEDetResponse
      const cae = Array.isArray(det) ? det[0]?.CAE : det?.CAE
      const resultado = Array.isArray(det) ? det[0]?.Resultado : det?.Resultado

      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFE",
          operacion: "FECAESolicitar",
          requestBody: serializeAfipPayload(requestPayload),
          responseBody: serializeAfipPayload(wsResult),
          statusCode: resultado ?? "?",
          cae: cae ?? undefined,
          facturaId,
          duracionMs: Date.now() - t0,
        })
      }

      // Normalizar det a objeto único
      if (wsResult?.FeDetResp?.FECAEDetResponse && Array.isArray(wsResult.FeDetResp.FECAEDetResponse)) {
        wsResult.FeDetResp.FECAEDetResponse = wsResult.FeDetResp.FECAEDetResponse[0]
      }

      return wsResult
    } catch (error) {
      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFE",
          operacion: "FECAESolicitar",
          requestBody: serializeAfipPayload(requestPayload),
          statusCode: "ERROR",
          duracionMs: Date.now() - t0,
          errorMsg: error instanceof Error ? error.message : String(error),
          facturaId,
        })
      }
      console.error("Error al emitir comprobante:", error)
      throw new Error(
        `Error al emitir comprobante en AFIP: ${error instanceof Error ? error.message : String(error)}`,
      )
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
        Auth: this.authBlock(auth, cuit),
        PtoVta: puntoVenta,
        CbteTipo: tipoComprobante,
      })
      return result.FECompUltimoAutorizadoResult?.CbteNro || 0
    } catch (error) {
      console.error("Error al consultar último comprobante:", error)
      return 0
    }
  }

  /**
   * FECompConsultar — reconsulta un comprobante ya autorizado.
   */
  async consultarComprobante(
    auth: AFIPAuthResponse,
    cuit: string,
    params: {
      tipoCbte: number
      puntoVenta: number
      numero: number
    },
    empresaId?: number,
  ): Promise<unknown> {
    const t0 = Date.now()
    const requestPayload = {
      Auth: this.authBlock(auth, cuit),
      FeCompConsReq: {
        CbteTipo: params.tipoCbte,
        CbteNro: params.numero,
        PtoVta: params.puntoVenta,
      },
    }
    try {
      const client = await soap.createClientAsync(this.wsfeUrl)
      const [result] = await client.FECompConsultarAsync(requestPayload)
      const wsResult = result.FECompConsultarResult
      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFE",
          operacion: "FECompConsultar",
          requestBody: serializeAfipPayload(requestPayload),
          responseBody: serializeAfipPayload(wsResult),
          statusCode: wsResult?.ResultGet?.Resultado ?? "OK",
          cae: wsResult?.ResultGet?.CodAutorizacion,
          duracionMs: Date.now() - t0,
        })
      }
      return wsResult
    } catch (error) {
      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFE",
          operacion: "FECompConsultar",
          requestBody: serializeAfipPayload(requestPayload),
          statusCode: "ERROR",
          errorMsg: error instanceof Error ? error.message : String(error),
          duracionMs: Date.now() - t0,
        })
      }
      throw error
    }
  }

  /**
   * FEParamGetPtosVenta — puntos de venta habilitados en AFIP.
   */
  async consultarPuntosVenta(
    auth: AFIPAuthResponse,
    cuit: string,
    empresaId?: number,
  ): Promise<
    Array<{
      Nro: number
      EmisionTipo: string
      Bloqueado: string
      FchBaja?: string
    }>
  > {
    const t0 = Date.now()
    try {
      const client = await soap.createClientAsync(this.wsfeUrl)
      const [result] = await client.FEParamGetPtosVentaAsync({
        Auth: this.authBlock(auth, cuit),
      })
      const raw = result?.FEParamGetPtosVentaResult?.ResultGet?.PtoVenta
      const list = !raw ? [] : Array.isArray(raw) ? raw : [raw]

      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFE",
          operacion: "FEParamGetPtosVenta",
          responseBody: serializeAfipPayload(list),
          statusCode: "OK",
          duracionMs: Date.now() - t0,
        })
      }

      return list.map(
        (p: {
          Nro?: number
          EmisionTipo?: string
          Bloqueado?: string
          FchBaja?: string
        }) => ({
          Nro: Number(p.Nro),
          EmisionTipo: String(p.EmisionTipo ?? ""),
          Bloqueado: String(p.Bloqueado ?? "N"),
          FchBaja: p.FchBaja,
        }),
      )
    } catch (error) {
      console.error("FEParamGetPtosVenta error:", error)
      throw new Error(
        `Error al consultar puntos de venta AFIP: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  /** FEParamGetTiposCbte */
  async consultarTiposComprobante(
    auth: AFIPAuthResponse,
    cuit: string,
  ): Promise<Array<{ Id: number; Desc: string; FchDesde?: string; FchHasta?: string }>> {
    const client = await soap.createClientAsync(this.wsfeUrl)
    const [result] = await client.FEParamGetTiposCbteAsync({
      Auth: this.authBlock(auth, cuit),
    })
    const raw = result?.FEParamGetTiposCbteResult?.ResultGet?.CbteTipo
    const list = !raw ? [] : Array.isArray(raw) ? raw : [raw]
    return list.map((t: { Id: number; Desc: string; FchDesde?: string; FchHasta?: string }) => ({
      Id: Number(t.Id),
      Desc: String(t.Desc),
      FchDesde: t.FchDesde,
      FchHasta: t.FchHasta,
    }))
  }

  /** Dummy / health: FEDummy */
  async dummy(): Promise<{ AppServer?: string; DbServer?: string; AuthServer?: string }> {
    const client = await soap.createClientAsync(this.wsfeUrl)
    const [result] = await client.FEDummyAsync({})
    return result?.FEDummyResult ?? {}
  }
}
