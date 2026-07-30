/**
 * CAEA — Código de Autorización Electrónico Anticipado
 *
 * RG 5782/2025: Plan de contingencia para emisión offline.
 * El CAEA se solicita anticipadamente y se usa cuando AFIP/ARCA está caído.
 *
 * Flujo:
 *   1. Solicitar CAEA para un punto de venta + período (quincena)
 *   2. Almacenar en DB el CAEA vigente
 *   3. Ante corte de internet, emitir FC con el CAEA pre-autorizado
 *   4. Al recuperar conectividad, informar comprobantes emitidos con CAEA
 *
 * Webservice: WSFEv1 → FECAEASolicitar / FECAEAInformar / FECAEAConsultar
 */

import type { AFIPAuthResponse } from "./wsaa-service"
import soap from "soap"

export interface CAEAData {
  caea: string
  periodo: string    // YYYYMM
  quincena: 1 | 2    // 1 = 1-15, 2 = 16-último
  fechaDesde: string  // YYYYMMDD
  fechaHasta: string  // YYYYMMDD
  fechaTopeInformar: string
}

export class CAEAService {
  private wsfeUrl: string

  constructor(entorno: "homologacion" | "produccion") {
    this.wsfeUrl =
      entorno === "produccion"
        ? "https://servicios1.afip.gov.ar/wsfev1/service.asmx?wsdl"
        : "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?wsdl"
  }

  /**
   * Solicitar un CAEA para un punto de venta y período.
   * Debe ejecutarse al inicio de cada quincena (job programado).
   */
  async solicitarCAEA(
    auth: AFIPAuthResponse,
    cuit: string,
    puntoVenta: number,
  ): Promise<CAEAData> {
    const now = new Date()
    const periodo = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`
    const quincena: 1 | 2 = now.getDate() <= 15 ? 1 : 2

    const client = await soap.createClientAsync(this.wsfeUrl)

    const [result] = await client.FECAEASolicitarAsync({
      Auth: { Token: auth.token, Sign: auth.sign, Cuit: cuit },
      Periodo: parseInt(periodo),
      Orden: quincena,
    })

    const response = result?.FECAEASolicitarResult?.ResultGet
    if (!response?.CAEA) {
      const errors = result?.FECAEASolicitarResult?.Errors
      throw new Error(`CAEA no otorgado: ${JSON.stringify(errors)}`)
    }

    return {
      caea: response.CAEA,
      periodo,
      quincena,
      fechaDesde: response.FchVigDesde,
      fechaHasta: response.FchVigHasta,
      fechaTopeInformar: response.FchTopeInf,
    }
  }

  /**
   * Informar comprobantes emitidos offline con CAEA.
   * Debe ejecutarse al recuperar conectividad.
   */
  async informarComprobantesCAEA(
    auth: AFIPAuthResponse,
    cuit: string,
    puntoVenta: number,
    caea: string,
    comprobantes: Array<{
      tipoCbte: number
      cbteDesde: number
      cbteHasta: number
      fecha: string
      docTipo: number
      docNro: string
      impTotal: number
      impNeto: number
      impIVA: number
      impTrib: number
      impTotConc?: number
      impOpEx?: number
      monId?: string
      monCotiz?: number
      concepto?: number
      condicionIvaReceptor?: number
      iva?: Array<{ Id: number; BaseImp: number; Importe: number }>
      tributos?: Array<{
        Id: number
        Desc: string
        BaseImp: number
        Alic: number
        Importe: number
      }>
    }>,
  ): Promise<{ ok: boolean; errores: string[] }> {
    const client = await soap.createClientAsync(this.wsfeUrl)

    const errores: string[] = []

    for (const cbte of comprobantes) {
      try {
        const det: Record<string, unknown> = {
          Concepto: cbte.concepto ?? 1,
          DocTipo: cbte.docTipo,
          DocNro: cbte.docNro,
          CbteDesde: cbte.cbteDesde,
          CbteHasta: cbte.cbteHasta,
          CbteFch: cbte.fecha,
          ImpTotal: cbte.impTotal,
          ImpTotConc: cbte.impTotConc ?? 0,
          ImpNeto: cbte.impNeto,
          ImpOpEx: cbte.impOpEx ?? 0,
          ImpIVA: cbte.impIVA,
          ImpTrib: cbte.impTrib,
          MonId: cbte.monId ?? "PES",
          MonCotiz: cbte.monCotiz ?? 1,
          CAEA: caea,
        }
        if (cbte.condicionIvaReceptor != null) {
          det.CondicionIVAReceptor = cbte.condicionIvaReceptor
        }
        if (cbte.iva?.length) {
          det.Iva = cbte.iva
        }
        if (cbte.tributos?.length) {
          det.Tributos = cbte.tributos
        }

        const [result] = await client.FECAEARegInformativoAsync({
          Auth: { Token: auth.token, Sign: auth.sign, Cuit: cuit },
          FeCAEARegInfReq: {
            FeCabReq: { CantReg: 1, PtoVta: puntoVenta, CbteTipo: cbte.tipoCbte },
            FeDetReq: {
              FECAEADetRequest: det,
            },
          },
        })

        const resp = result?.FECAEARegInformativoResult?.FeDetResp?.FECAEADetResponse
        const detResp = Array.isArray(resp) ? resp[0] : resp
        if (detResp?.Resultado !== "A") {
          errores.push(`Cbte ${cbte.cbteDesde}: ${JSON.stringify(detResp?.Observaciones)}`)
        }
      } catch (err) {
        errores.push(`Cbte ${cbte.cbteDesde}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    return { ok: errores.length === 0, errores }
  }

  /**
   * Consultar CAEA vigente para un punto de venta.
   */
  async consultarCAEA(
    auth: AFIPAuthResponse,
    cuit: string,
    caea: string,
  ): Promise<CAEAData | null> {
    const client = await soap.createClientAsync(this.wsfeUrl)

    const [result] = await client.FECAEAConsultarAsync({
      Auth: { Token: auth.token, Sign: auth.sign, Cuit: cuit },
      CAEA: caea,
    })

    const response = result?.FECAEAConsultarResult?.ResultGet
    if (!response) return null

    return {
      caea: response.CAEA,
      periodo: String(response.Periodo),
      quincena: response.Orden as 1 | 2,
      fechaDesde: response.FchVigDesde,
      fechaHasta: response.FchVigHasta,
      fechaTopeInformar: response.FchTopeInf,
    }
  }
}
