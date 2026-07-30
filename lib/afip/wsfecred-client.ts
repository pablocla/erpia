/**
 * WSFEcred — Factura de Crédito Electrónica MiPyME post-emisión.
 * Consulta de estado, aceptación/rechazo, cancelación (RG 4367 y mods).
 *
 * Service WSAA: wsfecred
 * WSDL homo: https://wswhomo.afip.gov.ar/wsfecred/service.asmx?wsdl
 * WSDL prod: https://serviciosjava.afip.gob.ar/wsfecred/service.asmx?wsdl
 */

import soap from "soap"
import type { AFIPAuthResponse, AfipEntorno } from "./wsaa-service"
import { logAfip, serializeAfipPayload } from "./afip-log"

function wsfecredUrl(entorno: AfipEntorno): string {
  return entorno === "produccion"
    ? "https://serviciosjava.afip.gob.ar/wsfecred/service.asmx?wsdl"
    : "https://wswhomo.afip.gov.ar/wsfecred/service.asmx?wsdl"
}

export type FceEstadoCodigo =
  | "pendiente"
  | "aceptada"
  | "rechazada"
  | "cancelada"
  | "vencida"
  | "desconocida"

export interface FceComprobanteRef {
  cuitEmisor: string
  tipoCbte: number
  puntoVenta: number
  numero: number
}

export class WSFEcredClient {
  private url: string
  private entorno: AfipEntorno

  constructor(entorno: AfipEntorno = "homologacion") {
    this.entorno = entorno
    this.url = wsfecredUrl(entorno)
  }

  private auth(auth: AFIPAuthResponse, cuit: string) {
    return {
      Token: auth.token,
      Sign: auth.sign,
      Cuit: cuit.replace(/\D/g, ""),
    }
  }

  /**
   * consultarMontoObligadoRecepcion — umbral FCE vigente.
   */
  async consultarMontoObligado(
    auth: AFIPAuthResponse,
    cuit: string,
    empresaId?: number,
  ): Promise<{ montoDesde?: number; raw?: unknown }> {
    const t0 = Date.now()
    try {
      const client = await soap.createClientAsync(this.url)
      // Nombre de operación varía entre versiones; intentar alias comunes
      const method =
        client.consultarMontoObligadoRecepcionAsync ??
        client.ConsultarMontoObligadoRecepcionAsync

      if (!method) {
        return { raw: { warning: "Operación consultarMonto no expuesta en WSDL" } }
      }

      const [result] = await method.call(client, {
        authRequest: this.auth(auth, cuit),
        cuitConsultada: cuit.replace(/\D/g, ""),
      })

      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFECRED",
          operacion: "consultarMontoObligadoRecepcion",
          responseBody: serializeAfipPayload(result),
          statusCode: "OK",
          duracionMs: Date.now() - t0,
        })
      }

      const monto =
        result?.consultarMontoObligadoRecepcionReturn?.montoDesde ??
        result?.return?.montoDesde

      return { montoDesde: monto != null ? Number(monto) : undefined, raw: result }
    } catch (error) {
      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFECRED",
          operacion: "consultarMontoObligadoRecepcion",
          statusCode: "ERROR",
          errorMsg: error instanceof Error ? error.message : String(error),
          duracionMs: Date.now() - t0,
        })
      }
      throw error
    }
  }

  /**
   * consultarComprobantes — listado / estado de FCE.
   */
  async consultarComprobantes(
    auth: AFIPAuthResponse,
    cuit: string,
    filtros: {
      fechaDesde?: string // YYYY-MM-DD
      fechaHasta?: string
      estado?: string
    } = {},
    empresaId?: number,
  ): Promise<{ items: unknown[]; raw?: unknown }> {
    const t0 = Date.now()
    try {
      const client = await soap.createClientAsync(this.url)
      const method =
        client.consultarComprobantesAsync ?? client.ConsultarComprobantesAsync

      if (!method) {
        return {
          items: [],
          raw: { warning: "Operación consultarComprobantes no expuesta en WSDL" },
        }
      }

      const [result] = await method.call(client, {
        authRequest: this.auth(auth, cuit),
        consultaComprobanteRequest: {
          fechaDesde: filtros.fechaDesde,
          fechaHasta: filtros.fechaHasta,
          codCtaCte: filtros.estado,
        },
      })

      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFECRED",
          operacion: "consultarComprobantes",
          requestBody: serializeAfipPayload(filtros),
          responseBody: serializeAfipPayload(result),
          statusCode: "OK",
          duracionMs: Date.now() - t0,
        })
      }

      const items =
        result?.consultarComprobantesReturn?.arrayComprobantes?.comprobante ??
        result?.return?.arrayComprobantes?.comprobante ??
        []

      return {
        items: Array.isArray(items) ? items : items ? [items] : [],
        raw: result,
      }
    } catch (error) {
      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFECRED",
          operacion: "consultarComprobantes",
          statusCode: "ERROR",
          errorMsg: error instanceof Error ? error.message : String(error),
          duracionMs: Date.now() - t0,
        })
      }
      throw error
    }
  }

  /**
   * aceptarRechazarFCE — acción del comprador (A=aceptar, R=rechazar).
   */
  async aceptarRechazar(
    auth: AFIPAuthResponse,
    cuit: string,
    ref: FceComprobanteRef,
    accion: "A" | "R",
    motivo?: string,
    empresaId?: number,
  ): Promise<{ ok: boolean; raw?: unknown; error?: string }> {
    const t0 = Date.now()
    const payload = {
      authRequest: this.auth(auth, cuit),
      codigoTipoComprobante: ref.tipoCbte,
      numeroPuntoVenta: ref.puntoVenta,
      numeroComprobante: ref.numero,
      cuitEmisor: ref.cuitEmisor.replace(/\D/g, ""),
      codigoTipoAceptacion: accion,
      motivoRechazo: motivo ?? "",
    }

    try {
      const client = await soap.createClientAsync(this.url)
      const method =
        client.aceptarRechazarFCAsync ??
        client.AceptarRechazarFCAsync ??
        client.aceptarRechazarFCEAsync

      if (!method) {
        return {
          ok: false,
          error:
            "WSDL WSFEcred no expone aceptarRechazarFC en este entorno. Usá el portal ARCA o actualizá el endpoint.",
          raw: { payload },
        }
      }

      const [result] = await method.call(client, payload)

      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFECRED",
          operacion: "aceptarRechazarFC",
          requestBody: serializeAfipPayload(payload),
          responseBody: serializeAfipPayload(result),
          statusCode: "OK",
          duracionMs: Date.now() - t0,
        })
      }

      return { ok: true, raw: result }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFECRED",
          operacion: "aceptarRechazarFC",
          requestBody: serializeAfipPayload(payload),
          statusCode: "ERROR",
          errorMsg: msg,
          duracionMs: Date.now() - t0,
        })
      }
      return { ok: false, error: msg }
    }
  }

  /**
   * informarCancelacionFCDE — cancelación por el emisor (cuando aplica).
   */
  async informarCancelacion(
    auth: AFIPAuthResponse,
    cuit: string,
    ref: FceComprobanteRef,
    empresaId?: number,
  ): Promise<{ ok: boolean; raw?: unknown; error?: string }> {
    const t0 = Date.now()
    const payload = {
      authRequest: this.auth(auth, cuit),
      codigoTipoComprobante: ref.tipoCbte,
      numeroPuntoVenta: ref.puntoVenta,
      numeroComprobante: ref.numero,
    }

    try {
      const client = await soap.createClientAsync(this.url)
      const method =
        client.informarCancelacionFCDEAsync ??
        client.InformarCancelacionFCDEAsync

      if (!method) {
        return {
          ok: false,
          error: "WSDL no expone informarCancelacionFCDE",
          raw: { payload },
        }
      }

      const [result] = await method.call(client, payload)
      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFECRED",
          operacion: "informarCancelacionFCDE",
          requestBody: serializeAfipPayload(payload),
          responseBody: serializeAfipPayload(result),
          statusCode: "OK",
          duracionMs: Date.now() - t0,
        })
      }
      return { ok: true, raw: result }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (empresaId) {
        await logAfip({
          empresaId,
          webservice: "WSFECRED",
          operacion: "informarCancelacionFCDE",
          statusCode: "ERROR",
          errorMsg: msg,
          duracionMs: Date.now() - t0,
        })
      }
      return { ok: false, error: msg }
    }
  }
}

export function mapFceEstadoAfip(codigo?: string | number): FceEstadoCodigo {
  const c = String(codigo ?? "").toUpperCase()
  if (c.includes("ACEPT") || c === "A") return "aceptada"
  if (c.includes("RECH") || c === "R") return "rechazada"
  if (c.includes("CANC")) return "cancelada"
  if (c.includes("PEND") || c === "P") return "pendiente"
  if (c.includes("VENC")) return "vencida"
  return "desconocida"
}
