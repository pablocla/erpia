/**
 * WSCDC — Constatación de Comprobantes ARCA/AFIP
 *
 * Verifica que un comprobante recibido de un proveedor tenga un CAE válido
 * y no haya sido rechazado, anulado o falsificado.
 *
 * Webservice: https://servicios1.afip.gov.ar/WSCDC/service.asmx?wsdl
 * Homologación: https://wswhomo.afip.gov.ar/WSCDC/service.asmx?wsdl
 *
 * Método principal: ComprobanteConstatar
 * Requiere: WSAA token/sign (servicio "wscdc")
 */

import soap from "soap"
import type { AFIPAuthResponse } from "./soap-client"

export interface ConstatacionInput {
  /** CUIT del emisor del comprobante a verificar */
  cuitEmisor: string
  /** Código de tipo de comprobante AFIP (1=FC A, 6=FC B, etc.) */
  tipoCbte: number
  puntoVenta: number
  numeroCbte: number
  /** Fecha de emisión YYYYMMDD */
  fechaEmision: string
  /** Importe total del comprobante */
  importeTotal: number
  /** Código de autorización (CAE o CAEA) */
  codAutorizacion: string
  /** "E" = CAE, "A" = CAEA */
  tipoAutorizacion?: "E" | "A"
  /** Tipo documento receptor: 80=CUIT, 96=DNI, 99=CF sin identificar */
  docTipoReceptor: number
  /** Número documento receptor */
  docNroReceptor: string
}

export interface ConstatacionResult {
  /** "A" = Aprobado (válido), "R" = Rechazado */
  resultado: "A" | "R"
  /** Observaciones de AFIP */
  observaciones: string[]
  /** Fecha de proceso */
  fechaProceso: string
  /** Datos del CAE verificado */
  caeVerificado?: string
  caeVencimiento?: string
}

export class WSCDCClient {
  private wscdcUrl: string

  constructor(entorno: "homologacion" | "produccion") {
    this.wscdcUrl =
      entorno === "produccion"
        ? "https://servicios1.afip.gov.ar/WSCDC/service.asmx?wsdl"
        : "https://wswhomo.afip.gov.ar/WSCDC/service.asmx?wsdl"
  }

  /**
   * Constatar un comprobante recibido de un proveedor.
   * Valida CAE, datos del emisor, tipo y número de comprobante.
   */
  async constatar(
    auth: AFIPAuthResponse,
    cuitVerificador: string,
    input: ConstatacionInput,
  ): Promise<ConstatacionResult> {
    const client = await soap.createClientAsync(this.wscdcUrl)

    const [result] = await client.ComprobanteConstatarAsync({
      Auth: {
        Token: auth.token,
        Sign: auth.sign,
        Cuit: cuitVerificador,
      },
      CmpReq: {
        CbteModo: input.tipoAutorizacion ?? "E",
        CuitEmisor: input.cuitEmisor,
        PtoVta: input.puntoVenta,
        CbteTipo: input.tipoCbte,
        CbteNro: input.numeroCbte,
        CbteFch: input.fechaEmision,
        ImpTotal: input.importeTotal,
        CodAutorizacion: input.codAutorizacion,
        DocTipoReceptor: input.docTipoReceptor,
        DocNroReceptor: input.docNroReceptor,
      },
    })

    const response = result?.ComprobanteConstatarResult?.ResultGet

    if (!response) {
      return {
        resultado: "R",
        observaciones: ["Sin respuesta de WSCDC"],
        fechaProceso: new Date().toISOString(),
      }
    }

    const observaciones: string[] = []
    if (response.Observaciones?.Obs) {
      const obs = Array.isArray(response.Observaciones.Obs)
        ? response.Observaciones.Obs
        : [response.Observaciones.Obs]
      for (const o of obs) {
        observaciones.push(`[${o.Code}] ${o.Msg}`)
      }
    }

    return {
      resultado: response.Resultado === "A" ? "A" : "R",
      observaciones,
      fechaProceso: response.FchProceso ?? new Date().toISOString(),
      caeVerificado: response.CodAutorizacion,
      caeVencimiento: response.FchVencimiento,
    }
  }
}
